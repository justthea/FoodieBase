const mongoose = require("mongoose");
const User = mongoose.model("User");
const promisify = require("es6-promisify");

exports.loginForm = (req, res) => {
  res.render("login", { title: "Login" });
};

exports.registerForm = (req, res) => {
  res.render("register", { title: "Register" });
};

//below is the simple way of doing validation
exports.validateRegister = (req, res, next) => {
  //sanitize their name make sure there is no script tag in it (not get hacked)
  //below method is from app.js - expressValidator which applies some validation methods to the req
  req.sanitizeBody("name");
  req.checkBody("name", "You must supply a name!").notEmpty();
  req.checkBody("email", "That email is not valid!").isEmail();
  //below make w.e.s.bos@googlemail.com and wesbos@gmail.com into same thing, so everything turns into one email account(cut down abuse)
  req.sanitizeBody("email").normalizeEmail({
    remove_dots: false,
    remove_extension: false,
    gmail_remove_subaddress: false,
  });
  req.checkBody("password", "Password cannot be blank!").notEmpty();
  req
    .checkBody("password-confirm", "Confirmed Password cannot be blank!")
    .notEmpty();
  req
    .checkBody("password-confirm", "Oops! Your passwords do not match")
    .equals(req.body.password);

  const errors = req.validationErrors();
  //handling the error ourselves
  if (errors) {
    req.flash(
      "error",
      errors.map((err) => err.msg)
    );
    //below achieved that the form will not be blank or back to the beginning if the vadlidation is not passed
    res.render("register", {
      title: "Register",
      body: req.body,
      flashes: req.flash(),
    });
    return; //stop the func from running if there is err
  }
  next();
};

exports.register = async (req, res, next) => {
  const user = new User({ email: req.body.email, name: req.body.name });
  //not going to call .save instead call .register which will take the password and save it in our db, which is a method in mongodb
  //User is the model, user is the one we r creating rn
  // User.register(user, req.body.password, function (err, user) {
  //     //.register is callback base, dont return promise, so we cannot use async await
  //   }); below is a way to make it promisify
  //                        the method u wanna promisify, which obj to bind to
  const register = promisify(User.register, User);
  //will store hash of password in the db
  await register(user, req.body.password);
  next(); // pass to authController.login
};

exports.account = (req, res) => {
  res.render("account", { title: "Edit Your Account" });
};

exports.updateAccount = async (req, res) => {
  const updates = {
    name: req.body.name,
    email: req.body.email,
  };
  const user = await User.findOneAndUpdate(
    //query
    //can go to account .pug file and do a dump on the user
    { _id: req.user._id },
    //update
    { $set: updates },
    //options
    { new: true, runValidators: true, context: "query" }
  );
  req.flash("success", "Profile is updated");
  //back will direct them to the url they came from
  res.redirect("back");
};
