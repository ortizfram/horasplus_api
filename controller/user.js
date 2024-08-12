const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");
const User = require("../model/User");

const userCtrl = {
  //!Register
  register: asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    
    // Validations
    if (!email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(409).json({ message: "User already exists" });
    }

    // Hash the user password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create the user
    const userCreated = await User.create({
      password: hashedPassword,
      email,
    });

    // Send the response
    console.log("userCreated", userCreated);
    res.status(201).json({
      email: userCreated.email,
      _id: userCreated._id,
    });
  }),

  //!Logout
  logout: asyncHandler(async (req, res) => {
    res.clearCookie("token"); // Example, adjust as necessary
    res.status(200).json({ message: "Logged out successfully" });
  }),
  
  //!Login
  login: asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    //!Check if user email exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    //!Check if user password is valid
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    //! Generate the token
    const token = jwt.sign({ id: user._id }, "anyKey", { expiresIn: "30d" });

    //!Send the response with cookie
    res.cookie("token", token, {
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });
    res.json({
      message: "Login success",
      _id: user._id,
      email: user.email,
      token:token
    });
  }),

  //!Profile
  profile: asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id);
    if (user) {
      res.json({
        email: user.email,
        _id: user._id,
      });
    } else {
      res.status(404);
      throw new Error("User not found");
    }
  }),
};
module.exports = userCtrl;
