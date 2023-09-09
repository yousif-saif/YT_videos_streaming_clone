const ffmpeg = require("fluent-ffmpeg")
const fs = require("fs")

function compressVideo(inputVideoPath, savePath){
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
                }
            })

        })
        .on('error', (err) => {
            console.error('Error:', err)
        })
        .save(savePath)
        
        

    })

}

module.exports = { compressVideo }