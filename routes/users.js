const express = require("express");
const userCtrl = require("../controller/user");
const isAuthenticated = require("../middlewares/isAuth");
const passport = require("passport");

const router = express.Router();

router.post("/register", userCtrl.register);
router.post("/login", userCtrl.login);
router.post("/logout", userCtrl.logout);
router.get("/profile", isAuthenticated, userCtrl.profile);
router.put("/:uid/update", userCtrl.updateProfile);
router.get("/:uid", userCtrl.getEmployee);

// passport login sys
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);
router.get(
  "/google/callback",
  passport.authenticate("google", { session: false }),
  userCtrl.googleLogin
);

router.get(
  "/facebook",
  passport.authenticate("facebook", { scope: ["email"] })
);
router.get(
  "/facebook/callback",
  passport.authenticate("facebook", { session: false }),
  userCtrl.facebookLogin
);

module.exports = router;
