// will config passport
const passport = require("passport");
const mongoose = require("mongoose");
const User = mongoose.model("User");
//                bc we use the plug in in user.js so we can use this method below
passport.use(User.createStrategy());
//tell passport what to do with the user, we just want the user obj
//what below do is everytime you have req, it will ask passport 'what should i do with user', and confirm if they are probaly log in
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
