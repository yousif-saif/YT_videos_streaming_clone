const mongoose = require("mongoose")
const Schema = mongoose.Schema

const videoSchema = new Schema({
    title: { type: String, required: true },
    videoFilePath: { type: String, required: true },
    thumbnailPath: { type: String, required: true },
    likes: { type: Number, default: 0, required: false },
    dislikes: { type: Number, default: 0, required: false },
    comments: { type: Array, default: [], required: false },


}, { timestamps: true })

const Video = mongoose.model("videos", videoSchema)

module.exports = Video