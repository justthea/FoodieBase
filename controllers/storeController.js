const mongoose = require("mongoose");
//already set Store in Store.js
const Store = mongoose.model("Store");
const User = mongoose.model("User");
//set up multer to send form as multipart (to upload image in form)
const multer = require("multer");
//to resize uoloaded pics
const jimp = require("jimp");
//to make file name unique (two person uploaded file with same name and they should not overwrite each other)
const uuid = require("uuid");

const multerOptions = {
  storage: multer.memoryStorage(),
  fileFilter(req, file, next) {
    //mimetype tells you what type of file it is, cannot rely on the extension bc there might be virus
    const isPhoto = file.mimetype.startsWith("image/");
    if (isPhoto) {
      //if next(value), then means there is an error, if next(null, true), means it worked and true is what needs to be passed along
      next(null, true);
    } else {
      next({ message: "That filetype isn't allowed!" }, false);
    }
  },
};

// //specific middleware
// exports.myMiddleWare = (req, res, next) => {
//   req.name = "Wes";
//   //handle specific case that we think is an error
//   if (req.name === "Wes") {
//     throw Error("That is a stupid name");
//   }
//   // can set cookies in here too
//   next();
// };

//whenever someone req to the homepage
exports.homePage = (req, res) => {
  //if console.log(req.name), will see 'Wes'
  console.log(req.name);
  req.flash("warning", "Something Happened");
  //index file
  res.render("index");
};

exports.addStore = (req, res) => {
  res.render("editStore", { title: "Add Store" });
};

//need to create middleware that works with createStore
//looking for a single field called photo for multer to handle
//reads into memory: doesnt save the file to disk but just store it in memory of your server. temproary
exports.upload = multer(multerOptions).single("photo");
//resize
exports.resize = async (req, res, next) => {
  //check if there is no new file to resize
  if (!req.file) {
    next(); //skip to the next middleWAre
    return;
  }
  //buffer a representation of the file in memeory
  // we need to pull the mimetype
  const extension = req.file.mimetype.split("/")[1];
  //uuid will generate a unique id for the photo so they dont overlapping eachother
  req.body.photo = `${uuid.v4()}.${extension}`;
  //now we resize, jimp is a package based on promises
  const photo = await jimp.read(req.file.buffer);
  await photo.resize(800, jimp.AUTO);
  await photo.write(`./public/uploads/${req.body.photo}`);
  //once we have written the ohto to our filesystem, keep going
  next();
};

exports.createStore = async (req, res) => {
  //we need to have an author asccoiate with it when creating a store
  req.body.author = req.user._id; // this is the current user's id, we can polulate the data when creating the store
  // to do test: console.log(req.body)
  // res.json(req.body);
  const store = await new Store(req.body).save();
  //fire a connection to mongodb,save the data. and come back to us to the store it self or error
  //bs js is oringinally async, before it hits save, it would hit the line below it.
  //so we normally put a cb func inside save() to check if there is an error
  //below is the old nested way
  // store.save(function(err, store){
  //   if(!err) {
  //     console.log('it works')
  //     res.redirect('/')
  // }
  // });

  //now we use Promises
  // store
  //   .save()
  //   .then((store) => {
  //     // res.json(store);
  //     return Store.find();
  //   })
  //   .then((stores) => {
  //     res.render("storeList", { store: stores });
  //   })
  //   .catch((err) => {
  //     throw Error(err);
  //   });

  //even more modern, we use ES8 async await

  //below is a flash that has been required in app.js
  //flash methods have error, info, warning, success, and etc.
  req.flash(
    "success",
    `Successfully created ${store.name}. Care to leave a review?`
  );
  res.redirect("/store/${store.slug}");
};

exports.getStores = async (req, res) => {
  //1. query the database for a list of all stores
  //.find() will query the database for all of them
  //  add below to have page on ./store: not to find all stores, but to find a limit number of stores, and skip it
  const page = req.params.page || 1;
  const limit = 4;
  const skip = page * limit - limit;
  //  populate reviews at ./stores so on the storeCard we can see how many reviews each store has. otherwise the reviews val is null.
  //      populate it mannually: const stores = await Store.find().populate("reviews")
  //      populate it auto: in Store.js model
  const storesPromise = Store.find().skip(skip).limit(limit);
  // console.log(stores);
  const countPromise = Store.count(); //returns a promise when it finish count all it will give us the actual data
  const [stores, count] = await Promise.all([storesPromise, countPromise]); //await both at the same time
  const pages = Math.ceil(count / limit);
  //guard against possible data changing
  if (!stores.length && skip) {
    //if not store data coma back and a skip val
    req.flash(
      "info",
      `Hey! you asked for page ${page}, but that doesn't exist, so i put you on page ${pages}`
    );
    res.redirect(`/stores/page/${pages}`);
    return;
  }
  res.render("stores", { title: "Stores", stores, page, pages, count });
};

//only the owner can edit the store
const confirmOwner = (store, user) => {
  //to have additional permission:  || user.level < 10
  if (!store.author.equals(user._id)) {
    throw Error("You must own a store in order to edit it");
  } // equals is a method to compare objectID and actual string
};

exports.editStore = async (req, res) => {
  //1. find the store given the id
  //req.params.id is the id string
  //can use res.json() to render/show some value on the webpage for developing purpose
  //Store is the Store model
  const store = await Store.findOne({ _id: req.params.id });
  //2. confirm they r the owner of the store
  confirmOwner(store, req.user);
  //3. render out the edit form so the user can update their store
  // what's inside{ } below is what we pass in to editStore.pug
  res.render("editStore", { title: `Edit ${store.name}`, store });
};

exports.updateStore = async (req, res) => {
  //set the location data to be a point
  req.body.location.type = "Point";
  //find and update the store
  //takes query,data,options
  const store = await Store.findOneAndUpdate({ _id: req.params.id }, req.body, {
    new: true, //return the new store instead of the old one
    runValidators: true, //force to run required validators in store.js since ppl are not allowed to create empty string store name, they cannot edit it to empty string as well
  }).exec(); // will actually run the query we have here
  req.flash(
    "success",
    `Successfully updated <strong>${store.name}</strong>. <a href="/store/${store.slug}">View Store →</a>`
  );
  //redirect them the store and tell them it worked
  res.redirect(`/stores/${store._id}/edit`);
};

exports.getStoreBySlug = async (req, res, next) => {
  //query: we dont have the id of the store, only have the slug, so we need to look into our db and see what the slug looks like
  const store = await Store.findOne({ slug: req.params.slug }).populate(
    "author reviews"
  ); //populate notes and find data for you
  // if the slug url is wrong, then store will return null, so null is not an error, so we have to handle that ourselves
  //next will go into app.js, in which if app.use('/', routes) cannot found, it will move on to the next, which is errorHandler, notFound
  if (!store) return next();
  res.render("store", { store, title: store.name });
};

exports.getStoresByTag = async (req, res) => {
  //to get the specific tag name
  const tag = req.params.tag;
  // either the tag or a property which is
  // if there is no tag, if will fall back to the second query which is just give me any store that has a tag property on it and it will show us every single store that has at least one tag on it
  const tagQuery = tag || { $exists: true };
  //dont use find bc we wanna get a list of tags, so we need to create our own method
  //make below tagsPromise so it can be fired at the same time as the query func, which can be fastest
  const tagsPromise = Store.getTagsList();
  // to query the list
  const storesPromise = Store.find({ tags: tagQuery });
  //wait for multiple prmoises to come back
  //below is es6 trick, setting [0] of the arr as tags, [1] as stores
  const [tags, stores] = await Promise.all([tagsPromise, storesPromise]);
  // render a pug file called tag
  res.render("tag", { tags, title: "Tags", tag, stores });
};

exports.searchStores = async (req, res) => {
  const stores = await Store
    //first find stores that match
    .find(
      {
        //below will perform a text search, a method in mongo
        $text: { $search: req.query.q },
      },
      {
        score: { $meta: "textScore" },
      }
    )
    //then sort them
    .sort({
      score: { $meta: "textScore" },
    })
    //limit to only 5 results
    .limit(5);
  res.json(stores);
};

exports.mapStores = async (req, res) => {
  const coordinates = [req.query.lng, req.query.lat].map(parseFloat);
  const q = {
    location: {
      $near: {
        $geometry: {
          type: "Point",
          coordinates,
        },
        $maxDistance: 10000, //10km
      },
    },
  };
  const stores = await Store.find(q)
    .select("slug name description location photo") // need to make this as slim as possible so our ajax req can be fast
    .limit(10);
  res.json(stores);
};

exports.mapPage = (req, res) => {
  res.render("map", { title: "Map" });
};

exports.heartStore = async (req, res) => {
  //if liked, unlike it, if unlike, like it
  //get a list of user - hearts
  const hearts = req.user.hearts.map((obj) => obj.toString());
  // User.findOneAndUpdate();
  //$pull : remove it from user from mongo
  //check if heart is already in that arr
  const operator = hearts.includes(req.params.id) ? "$pull" : "$addToSet";
  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      [operator]: { hearts: req.params.id },
    },
    { new: true } // return the user after its updated
  );
  res.json(user);
};

exports.getHearts = async (req, res) => {
  //query some stores and find whose id is in our heart arr
  const stores = await Store.find({
    _id: { $in: req.user.hearts }, // find any store which id is in anarr
  });
  res.render("stores", { title: "Hearted Stores", stores });
};

exports.getTopStores = async (req, res) => {
  const stores = await Store.getTopStores();
  // res.json(stores);
  res.render("topStores", { stores, title: "⭐️ Top Stores!" });
};
