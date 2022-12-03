const express = require("express");
const router = express.Router();
const storeController = require("../controllers/storeController");
const userController = require("../controllers/userController");
const authController = require("../controllers/authController");
const reviewController = require("../controllers/reviewController");

const { catchErrors } = require("../handlers/errorHandlers");
// Do work here
//in order to resue the code, we needs to put the original code below into its own controller
router.get("/", catchErrors(storeController.getStores));
router.get("/stores", catchErrors(storeController.getStores));
router.get("/stores/page/:page", catchErrors(storeController.getStores));
router.get("/add", authController.isLoggedIn, storeController.addStore);
router.post(
  "/add",
  storeController.upload,
  catchErrors(storeController.resize),
  catchErrors(storeController.createStore)
);
router.post(
  "/add/:id",
  storeController.upload,
  catchErrors(storeController.resize),
  catchErrors(storeController.updateStore)
);
router.get("/stores/:id/edit", catchErrors(storeController.editStore));
router.get("/store/:slug", catchErrors(storeController.getStoreBySlug));
router.get("/tags", catchErrors(storeController.getStoresByTag));
router.get("/tags/:tag", catchErrors(storeController.getStoresByTag));

router.get("/login", userController.loginForm);
router.post("/login", authController.login);
router.get("/register", userController.registerForm);
//1. validate registration data - make a middleWare in userContorller
//2. register the user
//3. log them in
router.post(
  "/register",
  userController.validateRegister,
  userController.register,
  authController.login
);

router.get("/logout", authController.logout);

router.get("/account", authController.isLoggedIn, userController.account);
router.post("/account", catchErrors(userController.updateAccount));
router.post("/account/forgot", catchErrors(authController.forgot));
router.get("/account/reset/:token", catchErrors(authController.reset));
//only do catchErrors when we r doing async await
router.post(
  "/account/reset/:token",
  authController.confirmedPasswords,
  catchErrors(authController.update)
);
router.get("/map", storeController.mapPage);
router.get(
  "/hearts",
  authController.isLoggedIn,
  catchErrors(storeController.getHearts)
);
router.post(
  "/reviews/:id",
  authController.isLoggedIn,
  catchErrors(reviewController.addReview)
);
router.get("/top", catchErrors(storeController.getTopStores));

//API endpoint
//or we can do '/api/v1/search' so if we make chnages to api and people r relying on it, we can just make a v2 for it
router.get("/api/search", catchErrors(storeController.searchStores));
router.get("/api/stores/near", catchErrors(storeController.mapStores));
router.post("/api/stores/:id/heart", catchErrors(storeController.heartStore));
//below are codes before ep7 that we deleted.
//(req, res) => {
// const wes = { name: "Wes", age: 100, cool: true };
// res.json(req.query);
//render the hello.pug template we just created
// res.render("hello", {
//below: setting varibles
//     name: "wes",
//     dog: req.query.dog,
//     title: "I love food",
//   });
// router.get("/reverse/:name", (req, res) => {
//   const reverse = [...req.params.name].reverse().join("");
//   res.send(reverse);
// });

module.exports = router;
