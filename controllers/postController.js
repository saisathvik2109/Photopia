const Post = require("../models/postModel");
const User = require("../models/userModel");

// exports.createPost = async (req, res, next) => {
//   const createdUser = req.user;
//   const newPost = {
//     picture: req.body.picture,
//     caption: req.body.caption,
//     createdBy: createdUser._id,
//     createdByName: createdUser.name,
//     createdByPic: createdUser.profilePic,
//   };
//   const post = await Post.create(newPost);

//   const userPosts = createdUser.posts;
//   userPosts.push(post._id);

//   await User.findByIdAndUpdate(
//     createdUser._id,
//     { $set: { posts: userPosts } },
//     { new: true }
//   );

//   res.redirect("/");
// };

exports.getPost = async (req, res, next) => {
  // .../posts/:postID
  const post = await Post.findById(req.params.postID);
  res.render("comments", {
    post: post,
    user: req.user,
    isLoggedIn: true,
  });
};

exports.comment = async (req, res, next) => {
  //  .../posts/:postID
  const commentedUser = req.user;
  const newComment = {
    content: req.body.comment,
    commentBy: commentedUser._id,
    commentByName: commentedUser.name,
    commentByPic: commentedUser.profilePic,
  };

  const post = await Post.findById(req.params.postID);
  const postComments = post.comments;
  postComments.push(newComment);

  await Post.findByIdAndUpdate(
    post._id,
    { $set: { comments: postComments } },
    { new: true }
  );

  res.redirect(`/posts/${post._id}`);
};

exports.likePost = async (req, res, next) => {
  const post = await Post.findById(req.body.postID);
  const user = req.user;
  if (user.likedPosts.includes(post._id)) {
    const userLikedPosts = user.likedPosts;
    const index = userLikedPosts.indexOf(post._id);
    userLikedPosts.splice(index, 1);

    let updatedUser = await User.findByIdAndUpdate(
      user._id,
      { $set: { likedPosts: userLikedPosts } },
      { new: true }
    );

    let likes = post.likes;
    likes--;

    let updatedPost = await Post.findByIdAndUpdate(
      post._id,
      { $set: { likes } },
      { new: true }
    );
    return res.status(200).send({ post: updatedPost, user: updatedUser });
  }

  const userLikedPosts = user.likedPosts;
  userLikedPosts.push(post._id);

  let updatedUser = await User.findByIdAndUpdate(
    user._id,
    { $set: { likedPosts: userLikedPosts } },
    { new: true }
  );

  let likes = post.likes;
  likes++;

  let updatedPost = await Post.findByIdAndUpdate(
    post._id,
    { $set: { likes } },
    { new: true }
  );
  return res.status(200).send({ post: updatedPost, user: updatedUser });
};

// exports.unlikePost = async (req, res, next) => {
//   const post = await Post.findById(req.body.postID);
//   const user = req.user;

//   const userLikedPosts = user.likedPosts;
//   const index = indexOf(post._id);
//   userLikedPosts.splice(index, 1);

//   await User.findByIdAndUpdate(
//     user._id,
//     { $set: { likedPosts: userLikedPosts } },
//     { new: true }
//   );

//   let likes = post.likes;
//   likes--;

//   let updatedPost = await Post.findByIdAndUpdate(
//     post._id,
//     { $set: { likes } },
//     { new: true }
//   );
//   console.log("updatedPost", updatedPost);
//   return res.status(200).send({ post: updatedPost });
// };

exports.deletePost = async (req, res, next) => {
  const currentUser = req.user;
  await Post.findByIdAndDelete(req.params.postID);

  const userPosts = currentUser.posts;
  const index = userPosts.indexOf(req.params.postID);
  userPosts.splice(index, 1);

  await User.findByIdAndUpdate(
    currentUser._id,
    { $set: { posts: userPosts } },
    { new: true }
  );

  res.redirect("/user");
};
