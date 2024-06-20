const fs = require("fs")
const cors = require("cors")
const multer = require("multer")
const dotenv = require("dotenv")
const express = require("express")
const mongoose = require("mongoose")
const session = require("express-session")
const User = require("../db/models/users")
const Video = require("../db/models/videos")
const { compressVideo, saveVideoToDatabase, updateFilesPaths } = require("./compress_video_with_ffmpeg")


const app = express()
dotenv.config()

const dbURI = process.env.DB_URI || "Please set a mongoDB URI before running this application"

mongoose.connect(dbURI)
.then((results) => console.log("connected to MongoDB successfully!"))

.catch((err) => {
    console.log("Error: ", err)
})


app.use(session({
    secret: process.env.sessionSecret,
    resave: false,
    saveUninitialized: true,
}))
  
app.use(cors())
app.use(express.urlencoded({ extended: true }))
app.set("view engine", "ejs")
app.use(express.static("frontend/public"))
app.use("/images", express.static("db/images"))
app.use(express.json())


async function getAllVideos() {
    try {
        const videos = await Video.find({})
        return videos

    } catch (error) {
        console.error("Error retrieving videos:", error)

    }
}


const storage = multer.diskStorage({
    filename: function (req, file, callback) {
        const fileName = file.originalname
        const dotIndex = fileName.lastIndexOf(".")

        if (dotIndex != -1){
            const fileExtention = fileName.substring(dotIndex + 1)

            if (fileExtention == "mp4"){
                callback(null, "../db/temp/" + fileName)


            }else if (["png", "jpeg", "jpg"].includes(fileExtention)) {
                callback(null, "../db/images/" + fileName)

            }

        }else{
            return null
        }

    },

    destination: function (req, file, callback) {
        callback(null, __dirname + "/../public/")

    }
    
})


const files = multer({storage: storage})

const port = 8000
app.listen(port, () => console.log(`Server is listing on port ${port}...`))

app.get("/", (req, res) => {
    getAllVideos()
    .then((videos) => {
        res.render("index.ejs", { videos, imagesPath: "/images/", isLogedIn: req.session.isLogin })

    })
    .catch((error) => {
        console.error("Error:", error)

    })
    
})

app.get("/login", (req, res) => {
    res.render("login.ejs", { isLogedIn: req.session.isLogin })

})

app.get("/sign_up", (req, res) => {
    res.render("sign_up.ejs", { isLogedIn: req.session.isLogin })
    
})


app.post("/login", (req, res) => {
    const { name, email, password } = req.body

    if (name == "" || email == "" || password == ""){
        return res.json({error: "Please Fill All The Blanks"})

    }

    User.find({name: name, email: email, password: password})
    .then((user) => {
        if (user.length != 0){
            req.session.isLogin = true
            req.session.userId = user[0]._id.toString()
            req.session.username = name
            req.session.email = email
            req.session.password = password

            return res.json({code: 200})

        } else {
            return res.json({error: "User Not Found"})
            
        }

    })

})

app.post("/sign_up", (req, res) => {
    const { name, email, password } = req.body

    if (name == "" || email == "" || password == ""){
        return res.json({error: "Please Fill All The Blanks"})

    }

    User.findOne({ $or: [{name: name}, {email: email}] })
    .then(user => {
        if (!user){
            const newUser = new User({ name: name, email: email, password: password })
            newUser.save()

            req.session.isLogin = true
            req.session.userId = newUser._id.toString()
            req.session.username = name
            req.session.email = email
            req.session.password = password
            return res.json({code: 200})
        

        } else {
            return res.json({error: "Name/Email already exists"})

        }

    })


})

app.get("/watch", (req, res) => {
    if (!req.session.isLogin){
        res.redirect("/login")
        return;
    }

    const id = req.query.v

    if (id.length > 24 || id.length < 24){
        return res.redirect("/video_not_found")

    }

    Video.findById(id)
    .then(video => {
        if (!fs.existsSync(video.videoFilePath)) {
            return res.redirect("/video_not_found")

        }else {
            const userId = req.session.userId
            if (!(video.views.includes(userId))) {
                video.views.push(userId)
                video.save()

            }

            res.render("video.ejs", { id, likes: video.likes.length, dislikes: video.dislikes.length, isLogedIn: req.session.isLogin, isliked: video.likes.includes(userId), isdisliked: video.dislikes.includes(userId), comments: video.comments, views: video.views.lengt, userId: req.session.userId, videoCreatorId: video.userId })

        }
    })

})
app.get("/video", (req, res) => {
    const range = req.headers.range
    if (!range) {
        res.status(400).send("Requires Range header")
    }
    
    const id = req.query.id
    
    Video.findById(id)
    .then((video) => {
        if (video == null || video == {}){
            return res.json({error: "Video is not found"})
        }

        const videoPath = video.videoFilePath

        const videoSize = fs.statSync(videoPath).size

        const CHUNK_SIZE = 10 ** 6 // 1MB
        const start = Number(range.replace(/\D/g, ""))
        const end = Math.min(start + CHUNK_SIZE, videoSize - 1)
      
        // Create headers
        const contentLength = end - start + 1
        const headers = {
          "Content-Range": `bytes ${start}-${end}/${videoSize}`,
          "Accept-Ranges": "bytes",
          "Content-Length": contentLength,
          "Content-Type": "video/mp4",
        }
      
        res.writeHead(206, headers)
      
        const videoStream = fs.createReadStream(videoPath, { start, end })
      
        videoStream.pipe(res)

    })
    .catch(err => {
        console.log("ERROR ON GETING VIDEO FILE PATH", err)
    })


})


app.get("/upload", (req, res) => {
    if (req.session.isLogin){
        res.render("upload", { isLogedIn: req.session.isLogin })

    }else{
        res.redirect("/login")
    }

})

app.post("/upload", files.array("files"), function (req, res) {
    if (!req.session.isLogin){
        return res.redirect("/login")

    }

    const title = req.body.title

    if (title == "" || title == null) {
        console.log("error in the title")
        return res.json({error: "Title is required"})

    }

    if (req.files.length <= 1){
        console.log("error in the length")
        return res.json({error: "Please provide both video and a thumbnail"})

    }

    let thumbnail = ""
    let video = ""

    if (req.files[0].mimetype.indexOf("video") != -1){
        video = req.files[0]
        thumbnail = req.files[1]

    }else{
        video = req.files[1]
        thumbnail = req.files[0]

    }


    const videoName = video.originalname
    const imageName = thumbnail.originalname

    const imageExtention = imageName.substring(imageName.lastIndexOf("."))

    const savePath = __dirname + "\\..\\db\\videos\\" + videoName

    const compressionPromises = req.files.map(async (file) => {
        if (file.mimetype.indexOf("video") != -1){
            if (video.size > 10 ** 6){
                return compressVideo(video.path, savePath, title, thumbnail.path, imageName, imageExtention, req.session.userId)
    
            }else{
                saveVideoToDatabase(title, savePath + ".mp4", thumbnail.path, req.session.userId)
                .then((videoId) => {
                    fs.rename(video.path, savePath + videoId + ".mp4", (err) => {
                        if (err){
                            console.log("ERROR WHILE RENAMING LESS THAN 1MB", err)
                            return res.json({error: "There was an error while uploading your video"})

                        }
    
                    })
                    fs.rename(thumbnail.path, __dirname + "\\..\\db\\images\\" + imageName + videoId + imageExtention, (err) => {
                        if (err){
                            console.log("ERROR WHILE RENAMING LESS THAN 1MB", err)
                            return res.json({error: "There was an error while uploading your video"})

                        }
                    })

                    updateFilesPaths(savePath + videoId + ".mp4", imageName + videoId + imageExtention, videoId)
    
                })
                
                return null
            }
    
        }
        
    })

    async function awaitAllPromise(){
        await Promise.all(compressionPromises)

    }

    awaitAllPromise()


    res.json({status: "files recevied"})

})

app.get("/video_not_found", (req, res) => {
    res.render("video_not_found.ejs", { isLogedIn: req.session.isLogin })
})


app.get("/like", (req, res) => {
    if (!req.session.isLogin){
        return res.json({redirectUrl: "/login"})

    }
    const id = req.query.id

    const userId = req.session.userId

    Video.findById(id)
    .then(video => {
        if (video){       
            if (!(video.likes.includes(userId)) && !(video.dislikes.includes(userId))){
                video.likes.push(userId)
                video.save()
                return res.json({code: 200, likes: video.likes.length, dislikes: video.dislikes.length})

            }

            else if (!(video.likes.includes(userId)) && video.dislikes.includes(userId)){
                video.likes.push(userId)
                const userIndex = video.dislikes.indexOf(userId)
                video.dislikes.splice(userIndex, 1)
                video.save()
                return res.json({ code: 409, likes: video.likes.length, dislikes: video.dislikes.length })

            }

            else if (video.likes.includes(userId)){
                const userIndex = video.likes.indexOf(userId)
                video.likes.splice(userIndex, 1)
                video.save()
                return res.json({ code: 400, likes: video.likes.length, dislikes: video.dislikes.length })
            }
            
        } else {
            res.json({ error: "video not found" })
        }
    })

})


app.get("/dislike", (req, res) => {
    if (!req.session.isLogin){
        return res.json({redirectUrl: "/login"})

    }

    const id = req.query.id

    const userId = req.session.userId

    Video.findById(id)
    .then(video => {
        if (video){       
            if (!(video.dislikes.includes(userId)) && !(video.likes.includes(userId))){
                video.dislikes.push(userId)
                video.save()
                return res.json({ code: 200, dislikes: video.dislikes.length, likes: video.likes.length })

            }

            else if (!(video.dislikes.includes(userId)) && video.likes.includes(userId)){
                video.dislikes.push(userId)
                const userIndex = video.likes.indexOf(userId)
                video.likes.splice(userIndex, 1)
                video.save()
                return res.json({ code: 409, dislikes: video.dislikes.length, likes: video.likes.length })

            }

            else if (video.dislikes.includes(userId)){
                const userIndex = video.dislikes.indexOf(userId)
                video.dislikes.splice(userIndex, 1)
                video.save()
                return res.json({ code: 400, dislikes: video.dislikes.length, likes: video.likes.length })

            }
            
        } else {
            res.json({ error: "video not found" })
        }
    })


})

app.get("/logout", (req, res) => {
    req.session.destroy((error) => {
        if (error){
            console.log(error)
            return false
        }
    })

    res.redirect("/login")

})


app.post("/comment", (req, res) => {
    if (!req.session.isLogin){
        res.json({ urlRedirect: "/login" })
        return false

    }

    const { comment, id } = req.body

    if (comment == "" || comment == null){
        res.json({ error: "invaild comment" })
        return false

    }

    Video.findById(id)
    .then(video => {
        video.comments.push({ userName: req.session.username, text: comment })
        video.save()
        return res.json({ code: 200 })
        
    })

})