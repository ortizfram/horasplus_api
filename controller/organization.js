const asyncHandler = require("express-async-handler");
const Organization = require("../model/Organization");
const multer = require("multer");
const path = require("path");

// Configure multer for file storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // Adjust the path as needed
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// Organization Controller
const organizationCtrl = {
  //! Create Organization
  createOrganization: asyncHandler(async (req, res) => {
    const { name, image, userId } = req.body;

    // Validations
    if (!name) {
      return res.status(400).json({ message: "Organization name is required" });
    }

    // Create the organization
    const organization = await Organization.create({
      user_id: userId,
      name,
      image,
    });

    // Send the response
    res.status(201).json({
      message: "Organization created successfully",
      organization,
    });
  }),

  //! Get Organizations by User
  getOrganizations: asyncHandler(async (req, res) => {
    const userId = req.user._id; // Assuming you are getting the user ID from a middleware that attaches user to the request

    // Fetch organizations by user
    const organizations = await Organization.find({ user_id: userId });

    res.json(organizations);
  }),

  //! Get Organization by ID
  getOrganizationById: asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Fetch organization by ID
    const organization = await Organization.findById(id);

    if (organization) {
      res.json(organization);
    } else {
      res.status(404).json({ message: "Organization not found" });
    }
  }),

  //! Update Organization
  updateOrganization: asyncHandler(async (req, res) => {
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
  }),

  //! Delete Organization
  deleteOrganization: asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Delete organization
    const organization = await Organization.findByIdAndDelete(id);

    if (organization) {
      res.json({ message: "Organization deleted successfully" });
    } else {
      res.status(404).json({ message: "Organization not found" });
    }
  }),
};
module.exports = { organizationCtrl, upload };