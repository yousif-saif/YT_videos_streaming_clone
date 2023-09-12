const express = require("express")
const mongoose = require("mongoose")
const fs = require("fs")
const app = express()
const cors = require("cors")
const Video = require("./models/videos")
const multer = require("multer")
const { compressVideo, saveVideoToDatabase, updateFilesPaths } = require("./compress_video_with_ffmpeg")

const dbURI = "mongodb://127.0.0.1:27017/yt_clone"

mongoose.connect(dbURI)
.then((results) => console.log("connected to MongoDB successfully!"))

.catch((err) => {
    console.log("Error: ", err)
})

app.use(cors())
app.set("view engine", "ejs")
app.use(express.static("public"))


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
                callback(null, "temp/" + fileName)


            }else{
                callback(null, "images/" + fileName)

            }

        }else{
            return null
        }

    },

    destination: function (req, file, callback) {
        callback(null, __dirname + "/public/")

    }
    
})


const files = multer({storage: storage})

app.listen(8000, () => console.log("Server is listing on port 8000..."))

app.get("/", (req, res) => {
    getAllVideos()
    .then((videos) => {
        res.render("index.ejs", { videos })

    })
    .catch((error) => {
        console.error("Error:", error)

    })
    
})

app.get("/watch", (req, res) => {
    const id = req.query.v

    res.render("video.ejs", { id })

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
    res.render("upload")

})

app.post("/upload", files.array("files"), function (req, res) {
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

    const savePath = __dirname + "\\public\\videos\\" + videoName

    const compressionPromises = req.files.map(async (file) => {
        if (file.mimetype.indexOf("video") != -1){
            if (video.size > 10 ** 6){
                return compressVideo(video.path, savePath, title, thumbnail.path, imageName, imageExtention)
    
            }else{
                saveVideoToDatabase(title, savePath + ".mp4", thumbnail.path)
                .then((videoId) => {
                    fs.rename(video.path, savePath + videoId + ".mp4", (err) => {
                        if (err){
                            console.log("ERROR WHILE RENAMING LESS THAN 1MB", err)
                            return res.json({error: "There was an error while uploading your video"})

                        }
    
                    })
                    fs.rename(thumbnail.path, __dirname + "\\public\\images\\" + imageName + videoId + imageExtention, (err) => {
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

// sample data
// {
//     fieldname: 'files',
//     originalname: 'Untitled Project.mp4',
//     encoding: '7bit',
//     mimetype: 'video/mp4',
//     destination: 'C:\\Users\\msi\\Desktop\\express project/public/',
//     filename: 'videos/Untitled Project.mp4',
//     path: 'C:\\Users\\msi\\Desktop\\express project\\public\\videos\\Untitled Project.mp4',
//     size: 25131139
//   },

