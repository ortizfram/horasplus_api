const Organization = require("../model/Organization");
const multer = require("multer");
const path = require("path");
const { mongoose } = require("mongoose");
const sendEmailOrgOwner = require("../utils/sendEmailOrgOwner");
const User = require("../model/User");

// Configure multer for file storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // Adjust the path as needed
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage: storage });

// Organization Controller
const organizationCtrl = {
  //! Create Organization
  createOrganization: async (req, res) => {
    try {
      const { name, userId } = req.body;
      console.log("userId ", userId);
      let image = null;

      if (req.file) {
        console.log("Uploaded file:", req.file); // Debugging statement
        image = req.file.path;
      } else {
        console.log("No file uploaded"); // Debugging statement
      }

      // Validations
      if (!name) {
        return res
          .status(400)
          .json({ message: "Organization name is required" });
      }

      // Create the organization
      const organization = await Organization.create({
        user_id: new mongoose.Types.ObjectId(userId),
        name,
        image,
      });

      // Update user's organization_id
      const userUpdateResult = await User.findByIdAndUpdate(
        new mongoose.Types.ObjectId(userId),
        { organization_id: organization._id },
        { new: true }
      );

      if (!userUpdateResult) {
        return res.status(404).json({
          message: "User not found to update organization_id",
        });
      }

      // Send the response
      res.status(201).json({
        message: "Organization created successfully",
        organization,
      });
    } catch (error) {
      console.error("Error creating organization:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  getOrganizations: async (req, res) => {
    try {
      const { userId, isAdmin, isSuperAdmin } = req.query;
      console.log("Query parameters received:", { userId, isAdmin, isSuperAdmin }); // Debug log
  
      let query = {};
      if (isAdmin === 'true' && isSuperAdmin === 'false') {
        query = { user_id: new mongoose.Types.ObjectId(userId) };
      }
  
      const organizations = await Organization.find(query);
      if (organizations.length === 0) {
        console.log("No organizations found for user_id:", userId);
      }
      res.json(organizations);
    } catch (error) {
      console.error("Error fetching organizations:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },
  


  //! Get Organization by ID
  getOrganizationById: async (req, res) => {
    try {
      const { oid } = req.params;

      if (!oid || !mongoose.Types.ObjectId.isValid(oid)) {
        return res.status(400).json({ message: "Invalid organization ID" });
      }

      const organization = await Organization.findById(
        new mongoose.Types.ObjectId(oid)
      );

      if (organization) {
        res.json(organization);
      } else {
        res.status(404).json({ message: "Organization not found" });
      }
    } catch (error) {
      console.error("Error fetching organization:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  //! Update Organization
  updateOrganization: async (req, res) => {
    try {
      const { id } = req.params;
      const { name, image } = req.body;

      // Update organization
      const organization = await Organization.findByIdAndUpdate(
        id,
        { name, image },
        { new: true }
      );

      if (organization) {
        res.json({
          message: "Organization updated successfully",
          organization,
        });
      } else {
        res.status(404).json({ message: "Organization not found" });
      }
    } catch (error) {
      console.error("Error updating organization:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  //! Delete Organization
  deleteOrganization: async (req, res) => {
    try {
      const { oid } = req.params;

      // Delete organization
      const organization = await Organization.findByIdAndDelete(oid);

      if (organization) {
        res.json({ message: "Organization deleted successfully" });
      } else {
        res.status(404).json({ message: "Organization not found" });
      }
    } catch (error) {
      console.error("Error deleting organization:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  //? Be Part of an Organization
  bePart: async (req, res) => {
    const { oid } = req.params;
    const { uid } = req.body;
    console.log("Received bePart request with oid:", oid, "uid:", uid);

    try {
      if (
        !mongoose.Types.ObjectId.isValid(oid) ||
        !mongoose.Types.ObjectId.isValid(uid)
      ) {
        return res
          .status(400)
          .json({ message: "Invalid organization or user ID" });
      }

      const organization = await Organization.findById(oid);
      if (!organization)
        return res.status(404).json({ message: "Organization not found" });

      const user = await User.findById(uid);
      if (!user) return res.status(404).json({ message: "User not found" });

      // Check and update user association
      if (user.organization_id?.toString() === oid) {
        return res
          .status(400)
          .json({ message: "User already belongs to this organization" });
      }
      user.organization_id = oid;
      await user.save();

      return res
        .status(200)
        .json({ message: "User successfully associated", user });
    } catch (error) {
      console.error("Error in bePart:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  //? Accept Employee
  acceptEmployee: async (req, res) => {
    try {
      const { oid, uid } = req.params;
      let user = await User.findById(new mongoose.Types.ObjectId(uid));
      const organization = await Organization.findById(
        new mongoose.Types.ObjectId(uid)
      );

      user.organization_id = organization._id;

      await user.save();

      res.status(200).json({
        message: "Employee successfully accepted into the organization",
      });
    } catch (error) {
      console.error("Error accepting employee:", error);
      res.status(500).json({ message: "Server error" });
    }
  },

  //! Get Employees of Organization
  getEmployees: async (req, res) => {
    try {
      const { oid } = req.params;

      if (!mongoose.Types.ObjectId.isValid(oid)) {
        return res.status(400).json({ message: "Invalid organization ID" });
      }

      const organization = await Organization.findById(oid);
      if (organization) {
        const employees = await User.find({ organization_id: oid }).lean();
        res.json(employees);
      } else {
        res.status(404).json({ message: "Organization not found" });
      }
    } catch (error) {
      console.error("Error fetching employees:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },
};

module.exports = { organizationCtrl, upload };
