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
  },
  in: {
    type: String,
    required: true,
  },
  out: {
    type: String,
    required: false, // Make out optional
  },
  shift_mode: {
    type: String,
    enum: ["regular", "holiday", "vacation", "sick"], 
    required: true,
    default: "regular",
  },
  total_hours: {
    type: String,
    required: false,
  },
  location: { 
    latitude: {
      type: Number,
      required: false,
    },
    longitude: {
      type: Number,
      required: false,
    },
  },
});

module.exports = mongoose.model("Shift", shiftSchema);
