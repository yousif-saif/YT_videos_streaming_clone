const ffmpeg = require("fluent-ffmpeg")
const fs = require("fs")
const Video = require("./models/videos")


function compressVideo(inputVideoPath, savePath, videoTitle, thumbnailFilePath, imageName, imageExtention){
    return new Promise((resolve, reject) => {
        ffmpeg(inputVideoPath)
        .videoCodec('libx264')
        .audioCodec('aac')
        .videoBitrate('1000k')
        .audioBitrate('128k')
        .on('end', () => {
            fs.unlink(inputVideoPath, (err) => {
                if (err){
                    console.log("Error: ", err)

                } else {
                    try{
                        saveVideoToDatabase(videoTitle, savePath, thumbnailFilePath)
                        .then((videoId) => {
                            fs.renameSync(savePath, savePath + videoId + ".mp4")
                            fs.renameSync(thumbnailFilePath, __dirname + "\\public\\images\\" + imageName + videoId + imageExtention)
                            updateFilesPaths(savePath + videoId + ".mp4", imageName + videoId + imageExtention, videoId)

                        })

                    } catch (err) {
                        console.log("ERROR WHILE SAVING VIDEO: ", err)
                    }
                }
            })

        })
        .on('error', (err) => {
            console.error('Error:', err)
        })
        .save(savePath)
        
        

    })

}

async function saveVideoToDatabase(videoTitle, savePath, thumbnailFilePath){
    const sperate = thumbnailFilePath.split("\\")

    const savedVideo = new Video({
        title: videoTitle,
        videoFilePath: savePath,
        thumbnailPath: sperate[sperate.length - 1]

    })

    await savedVideo.save()
    return savedVideo.id

}

async function updateFilesPaths(newVideoPath, newImagePath, id){
    await Video.updateOne({ _id: id }, { videoFilePath: newVideoPath, thumbnailPath: newImagePath })

}


module.exports = { compressVideo, saveVideoToDatabase, updateFilesPaths }