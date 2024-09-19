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

      const user = await User.findById({
        _id: new mongoose.Types.ObjectId(uid),
      });
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const organization = await Organization.findOne({
        _id: new mongoose.Types.ObjectId(oid),
      });
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

      // Extract time portion from the dates
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

      // Format the current date in dd/mm/yyyy format
      const currentDate = new Date();
      const formattedDate = `${currentDate
        .getDate()
        .toString()
        .padStart(2, "0")}/${(currentDate.getMonth() + 1)
        .toString()
        .padStart(2, "0")}/${currentDate.getFullYear()}`;

      // Calculate total hours if outTime is provided
      let totalHours = null;
      if (outTimeDate) {
        totalHours = (outTimeDate - inTimeDate) / (1000 * 60 * 60);
      }

      // Create a shift object with formatted dates
      const newShift = new Shift({
        user_id: user._id,
        organization_id: organization._id,
        date: formattedDate, // Current date or another specified date
        in: formattedInTime,
        out: formattedOutTime,
        shift_mode: shiftMode,
        total_hours: totalHours, // Will be null if outTime is not provided
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

      // Find the ongoing shift (where out is null) for the given user and organization
      const ongoingShift = await Shift.findOne({
        user_id: new mongoose.Types.ObjectId(uid),
        organization_id: new mongoose.Types.ObjectId(oid),
        out: null, // We are looking for shifts without an out time
      });

      if (!ongoingShift) {
        return res.status(404).json({ message: "Ongoing shift not found" });
      }

      // Convert outTime to a Date object and validate
      const outTimeDate = new Date(outTime);
      if (isNaN(outTimeDate.getTime())) {
        return res.status(400).json({ message: "Invalid outTime date format" });
      }

      // Update the shift's out time first
      const formattedOutTime = outTimeDate.toLocaleTimeString("en-AR", {
        timeZone: "America/Argentina/Buenos_Aires",
        hour12: false,
      });
      ongoingShift.out = formattedOutTime;

      // Save the shift to update the out time
      await ongoingShift.save();

      // Convert in and out times to Date objects
      const inTimeDate = new Date(`${ongoingShift.date} ${ongoingShift.in}`);
      const formattedOutTimeDate = new Date(
        `${ongoingShift.date} ${formattedOutTime}`
      );

      // Calculate total hours worked
      const totalMilliseconds = formattedOutTimeDate - inTimeDate;
      const totalHours = Math.floor(totalMilliseconds / (1000 * 60 * 60));
      const totalMinutes = Math.floor(
        (totalMilliseconds % (1000 * 60 * 60)) / (1000 * 60)
      );
      const totalHoursString = `${totalHours}h ${totalMinutes}m`;

      // Update total_hours in the shift document
      ongoingShift.total_hours = totalHoursString;

      // Save the shift with the calculated total hours
      await ongoingShift.save();

      res
        .status(200)
        .json({ message: "Shift ended successfully", shift: ongoingShift });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal server error" });
    }
  },
  userReport: async (req, res) => {
    try {
      const { uid } = req.params;
      const { startDate, endDate } = req.query; // Query params from frontend

      if (!startDate || !endDate) {
        return res
          .status(400)
          .json({ message: "Please provide both startDate and endDate" });
      }
      console.log(startDate, endDate)

      const start = new Date(startDate);
      const end = new Date(endDate);

      const shifts = await Shift.find({
        employeeId: uid,
        shiftDate: { $gte: start, $lte: end },
      });

      res.json(shifts);
    } catch (error) {
      console.error("Error fetching shifts:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },
};

module.exports = { shiftCtrl };
