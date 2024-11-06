const express = require("express");
const { shiftCtrl } = require("../controller/userShift");

const router = express.Router();

router.post("/:uid/:oid", shiftCtrl.createShift);
router.put("/:uid/:oid", shiftCtrl.leaveShift);
router.get("/:uid", shiftCtrl.userReport);
router.put("/:uid", shiftCtrl.updateShift);
router.post("/:uid/add-fix", shiftCtrl.addShiftFromUpdateView);
router.get("/:uid/fetch", shiftCtrl.getAShift);

module.exports = router;
