const asyncHandler = require("express-async-handler");
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
  createOrganization: asyncHandler(async (req, res) => {
    const { name, userId } = req.body;
    let image = null;

    if (req.file) {
      console.log("Uploaded file:", req.file); // Debugging statement
      image = req.file.path;
    } else {
      console.log("No file uploaded"); // Debugging statement
    }

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

  //! Get Organizations by User or get all
  getOrganizations: asyncHandler(async (req, res) => {
    const { userId } = req.query; // Extract userId from query parameters

    // If userId is provided, fetch organizations for that user
    const query = userId
      ? { user_id: new mongoose.Types.ObjectId(userId) }
      : {};

    // Fetch organizations based on the query
    const organizations = await Organization.find(query);

    res.json(organizations);
  }),

  //! Get Organization by ID
  getOrganizationById: asyncHandler(async (req, res) => {
    const { oid } = req.params;

    // Fetch organization by ID
    const organization = await Organization.findById({ _id: oid });

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
    const { oid } = req.params;

    // Delete organization
    const organization = await Organization.findByIdAndDelete({ _id: oid });

    if (organization) {
      res.json({ message: "Organization deleted successfully" });
    } else {
      res.status(404).json({ message: "Organization not found" });
    }
  }),

  bePart: asyncHandler(async (req, res) => {
    const { oid } = req.params;
    const { uid } = req.body;

    const organization = await Organization.findById({
      _id: new mongoose.Types.ObjectId(oid),
    });
    let ownerId = organization.user_id;
    const user = User.findById({ _id: new mongoose.Types.ObjectId(uid) });

    let link = "http://localhost:8081/";
    await sendEmailOrgOwner(
      ownerId,
      uid,
      `Autoriza ${user.name} a entrar a ${organization.name}`,
      `Autoriza a usuario ${user.name} | ${user.email} a ser parte de tu organizacion ${organization.name}`,
      `<button><a href="${link}">Aceptar</a></button>`
    );
  }),
};
module.exports = { organizationCtrl, upload };
