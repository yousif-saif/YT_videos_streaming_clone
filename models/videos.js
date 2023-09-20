const mongoose = require("mongoose")
const Schema = mongoose.Schema

const videoSchema = new Schema({
    title: { type: String, required: true },
    videoFilePath: { type: String, required: true },
    thumbnailPath: { type: String, required: true },
    likes: [{ type: String, ref: "User" }],
    dislikes: [{ type: String, ref: "User" }],
    comments: [{ type: Map, ref: "User" }],
    views: [{ type: String, ref: "User" }]


}, { timestamps: true })

const Video = mongoose.model("videos", videoSchema)

module.exports = Video