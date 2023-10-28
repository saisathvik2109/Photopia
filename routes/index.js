const router = require("express").Router();
const postController = require("../controllers/postController");
const userController = require("../controllers/userController");
const { ensureAuthenticated } = require("../middleware");

router.get("/test", (req, res) => {
  console.log(req.user);
  res.send(req.user);
});

router
  .route("/posts/:postID")
  .get(ensureAuthenticated, postController.getPost)
  .post(ensureAuthenticated, postController.comment);

router.post(
  "/like",
  (req, res, next) => {
    console.log(req.body);
    next();
  },
  postController.likePost
);

router.get("/user", userController.getUser);
router.get("/delete/:postID", postController.deletePost);

module.exports = router;
