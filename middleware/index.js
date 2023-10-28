function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    console.log(req.isAuthenticated);
    return next();
  }
  res.redirect("/auth/google");
}

module.exports = {
  ensureAuthenticated,
};
