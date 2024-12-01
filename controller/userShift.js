const Organization = require("../model/Organization");
const User = require("../model/User");
const Shift = require("../model/UserShift");
const { mongoose } = require("mongoose");

// Function to calculate total hours
function calculateTotalHours(inTime, outTime) {
  const inDate = new Date(inTime);
  const outDate = new Date(outTime);

  if (isNaN(inDate.getTime()) || isNaN(outDate.getTime())) {
    console.error("Invalid date formats:", { inTime, outTime });
    return "0h 0m";
  }

  const diffMs = outDate - inDate;
  if (diffMs < 0) {
    console.warn("Negative time difference:", { inDate, outDate });
    return "0h 0m";
  }

  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  return `${hours}h ${minutes}m`;
}

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
      const totalHours =
        formattedOutTime && formattedInTime
          ? calculateTotalHours(formattedInTime, formattedOutTime)
          : "0h 0m";

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
      const shift = await Shift.findOne({
        user_id: uid,
        organization_id: oid,
        out: null, // Find the shift where 'out' time is still null (i.e., the ongoing shift)
      });

      if (!shift) {
        return res.status(404).json({ message: "Current shift not found" });
      }
      console.log("outTime:", outTime);
      console.log();

      // Combine the date with the in time
      const inTimeDate = new Date(`1970-01-01T${shift.in}`)

      // Validate inTime (ensure it's a valid date)
      if (isNaN(inTimeDate.getTime())) {
        return res.status(400).json({ message: "Invalid inTime format" });
      }


      // Validate outTime (ensure it's a valid date)
      if (outTime && isNaN(new Date(outTime).getTime())) {
        return res.status(400).json({ message: "Invalid outTime format" });
      }

      if (outTime) shift.out = new Date(outTime).getTime();

      await shift.save();

      if (shift.in && shift.out) {
        const inDate = new Date(`1970-01-01T${shift.in}`);
        const outDate = new Date(`1970-01-01T${new Date(outTime).getTime()}`);

        const diffMs = outDate - inDate;
        if (diffMs >= 0) {
          const hours = Math.floor(diffMs / (1000 * 60 * 60));
          const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
          shift.total_hours = `${hours}h ${minutes}m`;
        } else {
          shift.total_hours = "0h 0m";
        }
      }

      await shift.save();

      res.status(200).json({
        message: "Shift updated successfully",
        shift: shift,
      });
    } catch (error) {
      console.error("Error in leaveShift:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  // Standalone function for addShiftFromUpdateView
  addShiftFromUpdateView: async (req, res) => {
    const { uid } = req.params;
    const { date, inTime, outTime, mode, organization_id } = req.body;

    try {
      const newShift = new Shift({
        user_id: uid,
        organization_id: new mongoose.Types.ObjectId(organization_id),
        date: new Date(date).toISOString().split("T")[0],
        in: inTime || null,
        out: outTime || null,
        shift_mode: mode || "regular",
        total_hours:
          inTime && outTime ? calculateTotalHours(inTime, outTime) : "0h 0m",
      });

      await newShift.save();
      res
        .status(201)
        .json({ message: "Shift created successfully", shift: newShift });
    } catch (error) {
      console.error("Error creating shift:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  // updateShift method
  updateShift: async (req, res) => {
    const { uid } = req.params;
    const { date, inTime, outTime, mode } = req.body;

    try {
      const shift = await Shift.findOne({
        user_id: uid,
        date: new Date(date).toISOString().split("T")[0],
      });

      if (!shift) {
        return await shiftCtrl.addShiftFromUpdateView(req, res); // Call standalone function
      }

      if (inTime) shift.in = inTime;
      if (outTime) shift.out = outTime;
      if (mode) shift.shift_mode = mode;

      await shift.save();

      if (shift.in && shift.out) {
        const date = shift.date.toISOString().split("T")[0];
        const inDate = new Date(`${date}T${shift.in}`);
        const outDate = new Date(`${date}T${outTime}`);

        const diffMs = outDate - inDate;
        if (diffMs >= 0) {
          const hours = Math.floor(diffMs / (1000 * 60 * 60));
          const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
          shift.total_hours = `${hours}h ${minutes}m`;
        } else {
          shift.total_hours = "0h 0m";
        }
      }

      await shift.save();

      res.status(200).json({ message: "Shift updated successfully", shift });
    } catch (error) {
      console.error("Error updating shift:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  getAShift: async (req, res) => {
    const { uid } = req.params;
    const { date } = req.query; // Pass the date as a query parameter

    console.log("params date: ", date);
    console.log("ISOSString date: ", new Date(date).toISOString());

    try {
      const shift = await Shift.findOne({
        user_id: new mongoose.Types.ObjectId(uid),
        date: new Date(date).toISOString(), // Format date to YYYY-MM-DD
      });

      if (!shift) {
        return res
          .status(404)
          .json({ message: "Shift not found for the specified date" });
      }

      res.status(200).json(shift);
    } catch (error) {
      console.error("Error fetching shift:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  getLastShift: async (req, res) => {
    const { uid } = req.params;

    try {
      // Find the most recent shift for the user
      const shift = await Shift.findOne({
        user_id: new mongoose.Types.ObjectId(uid),
      })
        .sort({ date: -1 }) // Sort by date in descending order
        .exec();

      if (!shift) {
        return res
          .status(404)
          .json({ message: "No shifts found for the user" });
      }

      // Parse and calculate total hours
      const date = shift.date.toISOString().split("T")[0];
      const inTime = shift.in ? new Date(`${date}T${shift.in}`) : null;
      const outTime = shift.out ? new Date(`${date}T${shift.out}`) : null;

      let totalHours = "0h 0m";

      if (inTime && outTime) {
        const diff = outTime - inTime;
        if (diff > 0) {
          const hours = Math.floor(diff / (1000 * 60 * 60));
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          totalHours = `${hours}h ${minutes}m`;
        }
      }

      res.status(200).json({
        message: "Shift retrieved successfully",
        shift: { ...shift.toObject(), total_hours: totalHours },
      });
    } catch (error) {
      console.error("Error fetching last shift:", error);
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
