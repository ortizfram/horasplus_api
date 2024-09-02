const express = require("express");
const { shiftCtrl } = require("../controller/userShift");

const router = express.Router();

router.post("/:uid/:oid", shiftCtrl.createShift);
router.put("/:uid/:oid", shiftCtrl.leaveShift);

module.exports = router;
