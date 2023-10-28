const express = require("express");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const session = require("cookie-session");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const cors = require("cors");
const indexRouter = require("./routes");
const { ensureAuthenticated } = require("./middleware");
const User = require("./models/userModel");
const Post = require("./models/postModel");
const postController = require("./controllers/postController");
const os = require("os");

const app = express();

mongoose.connect(process.env.MONGODB_URI);
const db = mongoose.connection;
db.on("error", () => console.log("MongoDB connection error"));
db.once("open", () => console.log("MongoDB connected"));

app.use(cors());

passport.serializeUser((user, done) => {
  done(null, user._id);
});
passport.deserializeUser((_id, done) => {
  User.findById(_id, (err, user) => {
    if (err) {
      done(null, false, {
        error: err,
      });
    } else {
      done(null, user);
    }
  });
});

const callbackURL = `http://${process.env.NODE_ENV === "development" ? "localhost:3000" : process.env.MAIN_URL}/auth/google/callback`;

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL,
    },
    async (accessToken, refreshToken, profile, done) => {
      let userProfile = profile;
      process.nextTick(async () => {
        const email = userProfile.emails[0].value;
        const user = await User.findOne({ email });
        if (user) {
          return done(null, user);
        }
        const newUser = new User({
          name: userProfile.displayName,
          email: userProfile.emails[0].value,
          profilePic: userProfile.photos[0].value,
        });
        await newUser.save();
        return done(null, newUser);
      });
    }
  )
);

app.set("views", __dirname + "/views");
app.set("view engine", "ejs");
app.use(cookieParser("abcd"));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(
  session({
    secret: "shinzou sasageyo",
    key: "eren yeager",
  })
);
app.use(passport.initialize());
app.use(passport.session());
app.use(express.static(__dirname + "/public"));

app.use("/", indexRouter);

app.get("/", async (req, res) => {
  console.log("user", req.user);
  const posts = await Post.find();
  posts.reverse();
  if (req.isAuthenticated()) {
    res.render("home", { posts: posts, isLoggedIn: true, user: req.user });
  } else {
    res.render("homeVisitor", { posts: posts });
  }
});

app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

app.get(
  "/auth/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/",
    session: true,
  }),
  (req, res) => {
    res.redirect("/");
  }
);

app.get("/logout", (req, res) => {
  req.logout();
  res.redirect("/");
});

const cloudinary = require("cloudinary").v2;
const multer = require("multer");
const fs = require("fs");

if (!fs.existsSync("./uploads")) {
  fs.mkdirSync("./uploads");
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./uploads");
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});
const upload = multer({ storage });
app.use("/uploads", express.static("uploads"));

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

async function uploadToCloudinary(localFilePath) {
  const mainFolderName = "main";
  let newPath = localFilePath;
  if (os.platform() === "win32") {
    let str = localFilePath.split("\\");
    let fileName = str[str.length - 1];
    let folderName = str[str.length - 2];
    newPath = `/${folderName}/${fileName}`;
  }
  const filePathOnCloud = `${mainFolderName}/${newPath}`;

  return cloudinary.uploader
    .upload(localFilePath, { public_id: filePathOnCloud })
    .then((result) => {
      fs.unlinkSync(localFilePath);
      return {
        message: "Success",
        url: result.url,
      };
    })
    .catch((error) => {
      fs.unlinkSync(localFilePath);
      return { message: "Error", error };
    });
}

function buildSuccessMsg(urlList) {
  return {
    message: "Success",
    urlList: urlList,
  };
}

app.get("/upload", (req, res) => {
  res.render("fileupload");
});

app.post("/uploadphoto", upload.single("photo"), async (req, res, next) => {
  const localFilePath = req.file.path;
  const result = await uploadToCloudinary(localFilePath);
  const imageUrl = result.url;

  const createdUser = req.user;
  const newPost = {
    picture: imageUrl,
    caption: req.body.caption,
    createdBy: createdUser._id,
    createdByName: createdUser.name,
    createdByPic: createdUser.profilePic,
  };
  const post = await Post.create(newPost);

  const userPosts = createdUser.posts;
  userPosts.push(post._id);

  await User.findByIdAndUpdate(
    createdUser._id,
    { $set: { posts: userPosts } },
    { new: true }
  );

  res.redirect("/");
});

module.exports = app;
