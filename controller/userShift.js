const Organization = require("../model/Organization");
const User = require("../model/User");
const Shift = require("../model/UserShift");
const { mongoose } = require("mongoose");

const shiftCtrl = {
  createShift: async (req, res) => {
    try {
      const { uid, oid } = req.params;
      console.log("uid ",uid)
      const { inTime, outTime, shiftMode } = req.body;

      const user = await User.findById(uid);
      if (!user) return res.status(404).json({ message: "User not found" });

      const organization = await Organization.findById(oid);
      if (!organization)
        return res.status(404).json({ message: "Organization not found" });

      // Convert input times to Date objects
      const inTimeDate = new Date(inTime);
      const outTimeDate = outTime ? new Date(outTime) : null;

      // Validate date formats
      if (isNaN(inTimeDate.getTime()))
        return res.status(400).json({ message: "Invalid inTime date format" });

      if (outTime && isNaN(outTimeDate.getTime()))
        return res.status(400).json({ message: "Invalid outTime date format" });

      const formattedInTime = inTimeDate.toLocaleTimeString("en-AR", {
        timeZone: "America/Argentina/Buenos_Aires",
        hour12: false,
      });
      const formattedOutTime = outTimeDate
        ? outTimeDate.toLocaleTimeString("en-AR", {
            timeZone: "America/Argentina/Buenos_Aires",
            hour12: false,
          })
        : null;

      // Get the current date and format as dd-mm-yyyy
      const currentDate = new Date();
      const formattedDate = currentDate.toISOString().split("T")[0]; // Store as YYYY-MM-DD

      // Calculate total hours if outTime is provided
      let totalHours = null;
      if (outTimeDate) {
        totalHours = (outTimeDate - inTimeDate) / (1000 * 60 * 60);
      }

      const newShift = new Shift({
        user_id: user._id,
        organization_id: organization._id,
        date: formattedDate, // Save as ISO string
        in: formattedInTime,
        out: formattedOutTime,
        shift_mode: shiftMode,
        total_hours: totalHours,
      });

      await newShift.save();
      res
        .status(201)
        .json({ message: "Shift created successfully", shift: newShift });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  leaveShift: async (req, res) => {
    try {
      const { uid, oid } = req.params;
      const { outTime } = req.body;

      const ongoingShift = await Shift.findOne({
        user_id: uid,
        organization_id: oid,
        out: null,
      });

      if (!ongoingShift)
        return res.status(404).json({ message: "Ongoing shift not found" });

      const outTimeDate = new Date(outTime);
      if (isNaN(outTimeDate.getTime()))
        return res.status(400).json({ message: "Invalid outTime date format" });

      const formattedOutTime = outTimeDate.toLocaleTimeString("en-AR", {
        timeZone: "America/Argentina/Buenos_Aires",
        hour12: false,
      });
      ongoingShift.out = formattedOutTime;

      // Calculate total hours
      const inTimeDate = new Date(`${ongoingShift.date} ${ongoingShift.in}`);
      const formattedOutTimeDate = new Date(
        `${ongoingShift.date} ${formattedOutTime}`
      );
      const totalMilliseconds = formattedOutTimeDate - inTimeDate;
      const totalHours = Math.floor(totalMilliseconds / (1000 * 60 * 60));
      const totalMinutes = Math.floor(
        (totalMilliseconds % (1000 * 60 * 60)) / (1000 * 60)
      );
      const totalHoursString = `${totalHours}h ${totalMinutes}m`;

      ongoingShift.total_hours = totalHoursString;
      await ongoingShift.save();

      res.status(200).json({
        message: "Shift ended successfully",
        shift: {
          ...ongoingShift._doc,
          date: new Date(ongoingShift.date).toLocaleDateString("en-GB"), // Format as dd-mm-yyyy
        },
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  userReport: async (req, res) => {
    try {
      const { uid } = req.params;
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate)
        return res
          .status(400)
          .json({ message: "Please provide both startDate and endDate" });

      // Format start and end dates to ISO (YYYY-MM-DD) for querying MongoDB
      const start = new Date(startDate);
      const end = new Date(endDate);

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return res.status(400).json({ message: "Invalid date format" });
      }

      // Query shifts within the date range
      const shifts = await Shift.find({
        user_id: uid,
        date: { $gte: start, $lte: end },
      });

      // Format the shift dates before returning
      const formattedShifts = shifts.map((shift) => ({
        ...shift._doc,
        date: new Date(shift.date).toLocaleDateString("en-GB"), // Format to dd-mm-yyyy
      }));

      res.json(formattedShifts);
    } catch (error) {
      console.error("Error fetching shifts:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },
};

module.exports = { shiftCtrl };
