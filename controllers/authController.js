//passport is the library we use to log everyone in
const passport = require("passport");
const mongoose = require("mongoose");
const User = mongoose.model("User");
const crypto = require("crypto");
const promisify = require("es6-promisify");
const mail = require("../handlers/mail");
//strategy is used to auth, check if user name and password is sending correctly

exports.login = passport.authenticate("local", {
  //a config obj to tell what happened
  failureRedirect: "/login",
  failureFlash: "Failed Login!",
  successRedirect: "/",
  successFlash: "You are now logged in!",
});

//need to config passport in order to use local, so need to create a token to put user obj on each request

//logout
exports.logout = (req, res) => {
  req.logout();
  req.flash("success", "You are now logged out");
  res.redirect("/");
};

//only allow user add new sotre when logging in
exports.isLoggedIn = (req, res, next) => {
  //check if user is authed, below method is in passport
  if (req.isAuthenticated()) {
    next();
    return;
  }
  req.flash("error", "Oops you must be logged in to do that");
  res.redirect("/login");
};

exports.forgot = async (req, res) => {
  //check if user exists
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    // should not flash 'no account with that email exist which is a securtiy issue'
    req.flash("error", "A password reset has been mailed to you");
    return res.redirect("/login");
  }
  //set reset tokens and expriy on their account
  //below is a module generate seur strings
  user.resetPasswordToken = crypto.randomBytes(20).toString("hex");
  user.resetPasswordExpires = Date.now() + 3600000; // 1 hr from now
  await user.save();
  //send them email with the token
  const resetURL = `http://${req.headers.host}/account/reset/${user.resetPasswordToken}`;
  await mail.send({
    user,
    subject: "Password Reset",
    resetURL,
    filename: "password-reset", //when we are trying to render html, it will need this filename
  });
  req.flash("success", `You have been emailed a password reset link. `);
  //redirect to login page
  res.redirect("/login");
};

exports.reset = async (req, res) => {
  const user = await User.findOne({
    resetPasswordToken: req.params.token,
    // we are going to search in mongodb for an expires that are greater than rn
    resetPasswordExpires: { $gt: Date.now() },
  });
  if (!user) {
    req.flash("error", "Password reset is invalid or has expired");
    return res.redirect("/login");
  }
  //if there is a user, show the reset password form
  res.render("reset", { title: "Reset your password" });
};
//next need to be passed in the params if we call next in the func
exports.confirmedPasswords = (req, res, next) => {
  //use [] when accessing a property has - in it
  if (req.body.password === req.body["password-confirm"]) {
    next(); //keep it going to the update contoller
    return;
  }
  req.flash("error", "password do not match");
  res.redirect("back");
};

exports.update = async (req, res) => {
  //find the user and need to make sure its still in one hr
  const user = await User.findOne({
    resetPasswordToken: req.params.token,
    // we are going to search in mongodb for an expires that are greater than rn
    resetPasswordExpires: { $gt: Date.now() },
  });
  if (!user) {
    req.flash("error", "Password reset is invalid or has expired");
    return res.redirect("/login");
  }
  //below is orginally callback, (setPassword),so need to make it promisified
  const setPassword = promisify(user.setPassword, user);
  await setPassword(req.body.password);
  // need to earse token in mongo
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  const updatedUser = await user.save();
  await req.login(updatedUser);
  req.flash("success", "Nice, your password has been reset");
  res.redirect("/");
};
