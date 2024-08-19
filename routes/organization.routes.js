const express = require("express");
const { organizationCtrl, upload } = require("../controller/organization");
const isAuthenticated = require("../middlewares/isAuth");

const router = express.Router();

router.post("/", upload.single("image"), organizationCtrl.createOrganization);
router.get("/", organizationCtrl.getOrganizations);
router.delete("/:oid", organizationCtrl.deleteOrganization);

module.exports = router;
