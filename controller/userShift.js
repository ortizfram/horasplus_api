const Organization = require("../model/Organization");
const User = require("../model/User");
const Shift = require("../model/UserShift");
const { mongoose } = require("mongoose");

const shiftCtrl = {
  createShift: async (req, res) => {
    try {
      const { uid, oid } = req.params;
      console.log("uid ", uid);
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

      // Fetch the ongoing shift for the user in the specified organization
      const ongoingShift = await Shift.findOne({
        user_id: uid,
        organization_id: oid,
        out: null, // Find the shift where 'out' time is still null (i.e., the ongoing shift)
      });

      if (!ongoingShift)
        return res.status(404).json({ message: "Ongoing shift not found" });

      console.log(
        "ongoingShift.date ",
        ongoingShift.date,
        " ongoingShift.in ",
        ongoingShift.in
      );

      // Combine the date with the in time (without adding 'Z' which converts to UTC)
      const justDate = ongoingShift.date.toISOString().split("T")[0];
      const inTimeString = `${justDate}T${ongoingShift.in}`; // Combine date and time

      // Create new Date objects for both in and out times, considering the local time zone
      const inTimeDate = new Date(inTimeString);
      const outTimeDate = new Date(outTime);

      if (isNaN(outTimeDate.getTime()))
        return res.status(400).json({ message: "Invalid outTime date format" });

      // Calculate total hours worked in this shift (in milliseconds)
      const totalHoursInMs = outTimeDate - inTimeDate;

      // Convert the milliseconds to hours and minutes
      const hours = Math.floor(totalHoursInMs / (1000 * 60 * 60)); // Full hours
      const minutes = Math.floor(
        (totalHoursInMs % (1000 * 60 * 60)) / (1000 * 60)
      ); // Remaining minutes

      console.log("inTimeDate ", inTimeDate, " outTimeDate ", outTimeDate);
      console.log(
        "Calculated total hours: ",
        hours,
        " hours, ",
        minutes,
        " minutes"
      );

      // Format total hours as hh:mm
      const formattedTotalHours = `${hours}h ${minutes}m`;

      // Format the out time as hh:mm:ss in the local time zone
      const formattedOutTime = outTimeDate.toLocaleTimeString("en-AR", {
        timeZone: "America/Argentina/Buenos_Aires",
        hour12: false,
      });

      // Update the shift with the out time and total hours
      ongoingShift.out = formattedOutTime;
      ongoingShift.total_hours = formattedTotalHours;

      await ongoingShift.save();

      res.status(200).json({
        message: "Shift updated successfully",
        shift: ongoingShift,
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
