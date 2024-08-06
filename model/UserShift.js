const mongoose = require("mongoose");

const shiftSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  organization_id: {
    type: new mongoose.Schema.Types.ObjectId(),
    ref: "Organization",
    required: true,
  },
  // user.firstname, user.lastname (mixing tables)
  date: {},
  in: {},
  out: {},
  shift_mode: {},
  total_hours: {},
});

module.exports = mongoose.model("Shift", shiftSchema);
