const mongoose = require("mongoose");
const Schema = mongoose.Schema;
//dont have to do this but have to do bc of the bug in mongose, we've already did this in start.js. this just surpress the error
mongoose.Promise = global.Promise;
const md5 = require("md5");
const validator = require("validator");
const mongodbErrorHandler = require("mongoose-mongodb-errors");
// usually use below for saving the hash of password
const passportLocalMongoose = require("passport-local-mongoose");
//make model
const userSchema = new Schema({
  email: {
    type: String,
    unique: true,
    lowercase: true,
    trim: true,
    validate: [validator.isEmail, "Invalid Email Address"],
    required: "Please supply an email address",
  },
  name: {
    type: String,
    required: "Please supply a name",
    trim: true,
  },
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  //my likes: hearts is in an arr of ids that related to a store, so when we populate hearts we can see the stores
  hearts: [{ type: mongoose.Schema.ObjectId, ref: "Store" }],
});

//make a virtual field that can generate things on the fly
userSchema.virtual("gravatar").get(function () {
  //whatever we returned here will be returned in the gravatar
  //gravatar use hashing algo that will not leave user email in, but just show hash
  const hash = md5(this.email);
  return `https://gravatar.com/avatar/${hash}?s=200`;
});

//below is saying aboves email and name are our schema, can you add all the mthods and fields that are needed for us to add authentication to our schema? we wanna use email as schema(to log ppl in)
userSchema.plugin(passportLocalMongoose, { usernameField: "email" });
//below will change ugly errors into a prettier one, like when the unique is false
userSchema.plugin(mongodbErrorHandler);

module.exports = mongoose.model("User", userSchema);
