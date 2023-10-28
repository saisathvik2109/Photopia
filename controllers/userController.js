const User = require("../models/userModel");
const Post = require("../models/postModel");

exports.getUser = async (req, res, next) => {
  const currentUser = req.user;
  const userPostsPromises = currentUser.posts.map((ele) => {
    return Post.findById(ele);
  });

  const userPosts = await Promise.all(userPostsPromises);

  res.render("profile", {
    user: currentUser,
    posts: userPosts,
    isLoggedIn: true,
  });
};
