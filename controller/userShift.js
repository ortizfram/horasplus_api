const Organization = require("../model/Organization");
const User = require("../model/User");
const Shift = require("../model/UserShift");
const { mongoose } = require("mongoose");

const shiftCtrl = {
  createShift: async (req, res) => {
    try {
      const { uid, oid } = req.params;
      console.log("uid:", uid, "oid:", oid);
      const { inTime, outTime, shiftMode } = req.body;

      const user = await User.findById({ _id: new mongoose.Types.ObjectId(uid) });
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const organization = await Organization.findOne({ _id: new mongoose.Types.ObjectId(oid) });
      if (!organization) {
        return res.status(404).json({ message: "Organization not found" });
      }

      // Convert input times to Date objects
      const inTimeDate = new Date(inTime);
      const outTimeDate = outTime ? new Date(outTime) : null;

      // Validate date formats
      if (isNaN(inTimeDate.getTime())) {
        return res.status(400).json({ message: "Invalid inTime date format" });
      }

      if (outTime && isNaN(outTimeDate.getTime())) {
        return res.status(400).json({ message: "Invalid outTime date format" });
      }

      // Calculate total hours if outTime is provided
      let totalHours = null;
      if (outTimeDate) {
        totalHours = (outTimeDate - inTimeDate) / (1000 * 60 * 60);
      }

      // Convert to Argentina time zone
      const options = { timeZone: 'America/Argentina/Buenos_Aires', hour12: false };
      const formattedInTime = inTimeDate.toLocaleString('en-AR', options);
      const formattedOutTime = outTimeDate ? outTimeDate.toLocaleString('en-AR', options) : null;

      // Create a shift object with formatted dates
      const newShift = new Shift({
        user_id: user._id,
        organization_id: organization._id,
        date: new Date(), // Current date or another specified date
        in: formattedInTime,
        out: formattedOutTime,
        shift_mode: shiftMode,
        total_hours: totalHours, // Will be null if outTime is not provided
      });

      await newShift.save();

      res.status(201).json({ message: "Shift created successfully", shift: newShift });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal server error" });
    }
  },
};

module.exports = { shiftCtrl };
