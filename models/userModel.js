const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
  },
  profilePic: {
    type: String,
  },
  email: {
    type: String
  },
  posts: [String],
  likedPosts: [String],
});

const User = mongoose.model("User", userSchema);
module.exports = User;
