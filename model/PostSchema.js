const mongoose = require("mongoose");

const PostSchema = new mongoose.Schema({
    img : String,
    sumamry : String,
    quill : String,
    title : String,
    author : {
        type: mongoose.Schema.Types.ObjectId, 
        // model reference
        ref : 'database',
    }

},{timestamps:true})

const Post = mongoose.model("postDb", PostSchema);

module.exports = Post;