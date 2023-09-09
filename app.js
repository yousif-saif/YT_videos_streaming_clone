const express = require("express")
const mongoose = require("mongoose")
const fs = require("fs")
const app = express()
const cors = require("cors")
const multer = require("multer")
const { compressVideo } = require("./compress_video_with_ffmpeg")

// const dbURI = "mongodb://127.0.0.1:27017/yt_clone"

// mongoose.connect(dbURI)
// .then((results) => console.log("connected to MongoDB successfully!"))

// .catch((err) => {
//     console.log("Error: ", err)
// })

app.use(cors())
app.set("view engine", "ejs")
app.use(express.static("public"))


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
        // console.log(__dirname + "/public/" + imageOrVideo)
        // console.log("imageOrVideo: ", imageOrVideo)
        callback(null, __dirname + "/public/")

    }
    
})


const files = multer({storage: storage})

app.listen(8000, () => console.log("Server is listing on port 8000..."))

app.get("/", (req, res) => {
    const videos = [
        {id: 1, title: "this is the first!", img: "1.jpg"},
        {id: 2, title: "this is the second!", img: "2.jpg"},
        {id: 3, title: "this is the third!", img: "3.jpg"}
    ]

    res.render("index.ejs", { videos })
    
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

    // const videoPath = __dirname + "/public/videos/" + id + ".mp4"
    const videoPath = __dirname + "/public/videos/video_2023-08-29_16-37-26.mp4.mp4"
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


app.get("/upload", (req, res) => {
    res.render("upload.ejs")

})


app.post("/upload", files.array("files"), function (req, res) {
    // console.log(req.body)
    // console.log(req.files)

    const compressionPromises = req.files.map(async (file) => {
        if (file.mimetype.indexOf("video") != -1){
            if (file.size > 10 ** 6){
                return compressVideo(file.path, __dirname + "\\public\\videos\\" + file.originalname)
    
            }

        }

        return null
        
    })

    async function awaitAllPromise(){
        await Promise.all(compressionPromises)

    }

    awaitAllPromise()


    res.json({status: "files recevied"})

})


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