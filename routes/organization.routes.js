const express = require("express");
const { organizationCtrl, upload } = require("../controller/organization"); // Use organizationCtrl here
const isAuthenticated = require("../middlewares/isAuth");

const router = express.Router();

router.post("/", upload.single("image"), organizationCtrl.createOrganization); // Correct reference to organizationCtrl

module.exports = router;
