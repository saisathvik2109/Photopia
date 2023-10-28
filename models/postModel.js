const mongoose = require("mongoose");

const postSchema = new mongoose.Schema({
  picture: {
    type: String,
  },
  caption: {
    type: String,
  },
  createdBy: {
    type: String, // user ID
  },
  createdByName: {
    type: String,
  },
  createdByPic: {
    type: String,
  },
  likes: {
    type: Number,
    default: 0,
  },
  comments: [
    {
      content: String, //actual comment
      commentBy: String, // comment by userId
      commentByName: String, // username
      commentByPic: String,
    },
  ],
});

const Post = mongoose.model("Post", postSchema);
module.exports = Post;
