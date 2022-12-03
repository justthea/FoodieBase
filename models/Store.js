const { Store } = require("express-session");
const { relativeTimeThreshold } = require("moment");
const mongoose = require("mongoose");
mongoose.Promise = global.Promise;
const slug = require("slugs");

//schema默认参数
//Schema是一种以文件形式存储的数据库模型骨架，不具备数据库操作能力
//model是由schema发布生成的模型，具有数据库操作能力
//schema对应mongo中的集合collection, 定义了集合中文档的样式
const storeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      //dont write bollean true as value in below cause string will look better
      required: "Please enter a store name ",
    },
    //before saves the Store, will auto genertae slug so they can be passed in
    slug: String,
    description: {
      type: String,
      trim: true,
    },
    tags: [String], // an arr of strings
    created: {
      type: Date, // mongodb as some queries just for dates
      defalut: Date.now,
    },
    location: {
      type: {
        type: String,
        default: "Point",
      },
      coordinates: [
        {
          type: Number,
          required: "You must supply coordinates!",
        },
      ],
      address: {
        type: String,
        required: "You must supply an address",
      },
    },
    photo: String,
    //to connect data and user in db
    author: {
      type: mongoose.Schema.ObjectId, //this is just an obj
      ref: "User", //tell mongodb author is the User in User.js
      required: "You must supply an author",
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

//define our indexes
//(by default, id will always be in indexes-stores-mongodb bc thats the fastest way to look something up)
//(by default, email and id are default for users)
storeSchema.index({
  //compound index
  name: "text", //text will be easy to be searched
  description: "text",
  //tell mongo what we want it to be indexed as
});

storeSchema.index({ location: "2dsphere" }); //will add geospacial in mongodb

storeSchema.pre("save", async function (next) {
  if (!this.isModified("name")) {
    next(); // skip it
    return; // stop this function from running
  }
  //this = store
  // will take the name we passed in, run it through slug package and set slug property
  this.slug = slug(this.name);
  //find duplicate slugs before saving it
  //e.g.: find other stores that have a slug of wes, wes-1, wes-2
  //regEx(regular expression) is a way to pattern match in js (used in replace method)
  //i means case insensetive
  const slugRegEx = new RegExp(`^(${this.slug})((-[0-9]*$)?)$`, "i");
  //pass that regex into a query
  const storesWithSlug = await this.constructor.find({ slug: slugRegEx });
  if (storesWithSlug.length) {
    this.slug = `${this.slug}-${storesWithSlug.length + 1}`;
  }
  next();
  // TODO:make more resliiant so slugs are unique
});

//below is going to be bind to Store when exporting
storeSchema.statics.getTagsList = function () {
  //mongodb aggregate is just like findOne() which will take an array of possible operators of what we r looking for
  return this.aggregate([
    //below is a pipeline
    { $unwind: "$tags" },
    //group everything based on the tag field, and create a new field in each of those groups called count. each time we group one of that item, the count is going to add by 1
    { $group: { _id: "$tags", count: { $sum: 1 } } },
    //from the most popular to least popular
    { $sort: { count: -1 } },
  ]);
};

//get top stores
storeSchema.statics.getTopStores = function () {
  //return the promise so we can await the result from getTopStores and put into out actual var stores in storeController
  return this.aggregate([
    //look up Stores and populate their reviews
    //cannot use the virtual reviews below bc thats only for mongo, and aggragate is not mongo, just pass it right through mongo. aggrate is lower level mongo and dont know about higher level things
    {
      $lookup: {
        from: "reviews", //reviews is actually Review model, but mongodb transform it to reviews
        localField: "_id",
        foreignField: "store",
        as: "reviews", // as :'THEAISCOOL' and the review json field will be chnaged into theaiscool
      },
    },
    //filter for only items that have 2 or more reviews
    //match doc in reviews.1 (at index 1 in mongo db, mongo syntax), (= second item in mongo exist is true)
    { $match: { "reviews.1": { $exists: true } } },
    //add the average reviews field
    //project means add a field to the actual one
    {
      $addFields: {
        // can use $addField here since we have newst mongo, if have lower version, can use $project and add photo,name,reviews property manually
        //e.g.:
        //photo:'$$ROOT.photo',
        //name:'$$ROOT.name',
        //reviews: '$$ROOT.reviews'
        averageRating: { $avg: "$reviews.rating" }, //create a new field called averageRating and set the val of that to be the average of eac of the review's rating field. $avg does the math. $reviews's $ meaning the field from the data being piped in. here means where it's being piped in from out match
      }, //after this $project, we can only see data that has avg rating. the rest of the data (photo, name, reviews) can be seen if we use $addField instead of $project
    },
    //sort it by our new field, highest reviews first
    { $sort: { averageRating: -1 } },
    //limit to at most 10
    { $limit: 10 },
  ]);
};

//method in mongoose called virtual populate so wecan search the reviews of this store and all codes to populate its review will be in the Store model so things dont medd up
// find reviews where the stores_id === reviews store property
// virtual fields wont show on dump json (ie: store), but only show when you sepcifically ask for it (ie:store.review)
// if wanna change, can pass in an obj in the model as abive after author
storeSchema.virtual("reviews", {
  ref: "Review", //what model to link
  localField: "_id", //which field on our store (needs to match up with which on the foreign model)
  foreignField: "store", //which field on the review
});

function autopopulate(next) {
  this.populate("reviews");
  next();
}

//whenever we query a store using find or findOne, it should autopupulate the reviews
storeSchema.pre("find", autopopulate);
storeSchema.pre("findOne", autopopulate);

//if the main thing you are exporting from a file, is importable, can do below
module.exports = mongoose.model("Store", storeSchema);
