const mongoose = require("mongoose");
mongoose.Promise = global.Promise;

const reviewSchema = new mongoose.Schema({
  created: {
    type: Date,
    default: Date.now,
  },
  author: {
    type: mongoose.Schema.ObjectId, //need one of the exsiting user to be the author
    ref: "User", //user model bc need to ref to antoher model
    required: "You must supply an author",
  },
  store: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
    required: "You must supply a store",
  },
  text: {
    type: String,
    required: "Your review must have text",
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
  },
});

//we can add hooks to whenever this review is queried, auto pouplate the author field
function autopopulate(next) {
  this.populate("author");
  next();
}

reviewSchema.pre("find", autopopulate); // will add hooks whenever someone find or findone
reviewSchema.pre("findOne", autopopulate);

module.exports = mongoose.model("Review", reviewSchema);
