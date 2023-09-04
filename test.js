const fs = require("fs")

const stream = fs.createReadStream(__dirname + "/public/videos/1.mp4")

console.log(stream.le)