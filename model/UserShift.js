const mongoose = require("mongoose");

const shiftSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  organization_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Organization",
    required: true,
  },
  date: {
    type: Date,
    required: true,
    default: Date.now,
  },
  in: {
    type: Date,
    required: true,
  },
  out: {
    type: Date,
    required: false, // Make out optional
  },
  shift_mode: {
    type: String,
    enum: ["regular", "holiday"], 
    required: true,
  },
  total_hours: {
    type: Number,
    required: false, // Make total_hours optional
  },
});

module.exports = mongoose.model("Shift", shiftSchema);
