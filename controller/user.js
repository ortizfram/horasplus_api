const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../model/User");
const passport = require("passport");
const { mongoose } = require("mongoose");
const {
  ORIGIN_URL,
  BRAND_EMAIL,
  NODEMAILER_EMAIL,
  NODEMAILER_PASS,
} = require("../config");
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: NODEMAILER_EMAIL,
    pass: NODEMAILER_PASS,
  },
});

// Profile
const profile = async (req, res) => {
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
};

const updateProfile = async (req, res) => {
  const { uid } = req.params; // Extract user ID from the URL
  const updateData = req.body; // Data from the request body

  console.log("updateData: ", updateData);
  console.log("uid: ", uid);
  try {
    // Find user by ID and update fields
    const updatedUser = await User.findByIdAndUpdate(
      { _id: new mongoose.Types.ObjectId(uid) },
      updateData,
      {
        new: true, // Return the updated document
        runValidators: true, // Validate the data before updating
      }
    );

    if (!updatedUser) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json(updatedUser); // Return updated user
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
};

// Create JWT token function
const createToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET || "defaultSecretKey",
    { expiresIn: "30d" }
  );
};

// Register
const register = async (req, res) => {
  try {
    const { email, password, firstname, lastname } = req.body;

    // Validate input
    if (!email || !password || !firstname || !lastname) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Check if the user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(409).json({ message: "User already exists" });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Assign roles based on the email
    const roles = email === "admin@example.com" ? ["Admin"] : ["User"];

    // Create the user
    const userCreated = await User.create({
      email,
      password: hashedPassword,
      roles,
      firstname,
      lastname,
    });

    // Respond with user details
    res.status(201).json({
      email: userCreated.email,
      _id: userCreated._id,
      roles: userCreated.roles,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// Login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log(`Login request for email: ${email}`);

    // Check if the user exists
    const user = await User.findOne({ email });
    if (!user) {
      console.error("User not found");
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const userNoPass = { ...user.toObject() };
    delete userNoPass.password;

    // Compare the password
    const passwordMatches = await bcrypt.compare(password, user.password);
    if (!passwordMatches) {
      console.error("Password mismatch");
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Create a JWT token
    const token = createToken(user._id);

    // Set the token in an HTTP-only cookie
    res.cookie("token", token, {
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });

    console.log("Login successful");

    // Respond with user and token
    res.json({
      message: "Login successful",
      user: {
        data: userNoPass,
        _id: user._id,
        email: user.email,
        isAdmin: user.role.includes("Admin"),
        isSuperAdmin: user.role.includes("Super"),
      },
      token,
    });
  } catch (error) {
    console.error("Server error during login:", error); // Log the error
    res.status(500).json({ message: "Server error", error });
  }
};

const getEmployee = async (req, res) => {
  try {
    const { uid } = req.params;

    // Check if the uid is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(uid)) {
      return res.status(400).json({ message: "Invalid user ID format" });
    }

    // Fetch the employee using the valid ObjectId
    const employee = await User.findById(uid);
    if (employee) {
      res.json(employee);
    } else {
      res.status(404).json({ message: "Employee not found" });
    }
  } catch (error) {
    console.error("Error fetching employee:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
// Google Login
const googleLogin = async (req, res) => {
  try {
    const user = req.user;

    // Create a JWT token
    const token = createToken(user._id);

    // Set the token in an HTTP-only cookie
    res.cookie("token", token, {
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });

    // Respond with user and token
    res.json({ message: "Google login success", user, token });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// Facebook Login
const facebookLogin = async (req, res) => {
  try {
    const user = req.user;

    // Create a JWT token
    const token = createToken(user._id);

    // Set the token in an HTTP-only cookie
    res.cookie("token", token, {
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });

    // Respond with user and token
    res.json({ message: "Facebook login success", user, token });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// Logout
const logout = async (req, res) => {
  try {
    // Clear the token cookie
    res.clearCookie("token");

    // Respond with a success message
    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

const requestPasswordReset = async (req, res) => {
  const { email } = req.body;

  try {
    console.log(`Solicitud de restablecimiento de contraseña para el email: ${email}`);

    const user = await User.findOne({ email });
    if (!user) {
      console.log("Usuario no encontrado");
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    // Crear un token de restablecimiento
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = Date.now() + 3600000; // Expira en 1 hora
    console.log(`Token de restablecimiento generado: ${resetToken}`);

    // Guardar el token y su expiración en el usuario
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpiry = resetTokenExpiry;
    try {
      await user.save();
      console.log("Token y expiración guardados en el usuario");
    } catch (saveError) {
      console.error("Error al guardar el token en el usuario:", saveError);
      return res.status(500).json({ message: "Error al guardar el token", error: saveError });
    }

    // Enviar el correo electrónico con el enlace de restablecimiento
    const resetUrl = `${ORIGIN_URL}/reset-password/${resetToken}`;
    const mailOptions = {
      from: BRAND_EMAIL,
      to: user.email,
      subject: "Recuperación de contraseña",
      text: `Para restablecer tu contraseña, haz clic en el siguiente enlace: ${resetUrl}`,
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log(`Correo de recuperación enviado a ${user.email}`);
      res.json({ message: "Correo de recuperación enviado" });
    } catch (mailError) {
      console.error("Error al enviar el correo de recuperación:", mailError);
      res.status(500).json({ message: "Error al enviar el correo de recuperación", error: mailError });
    }
  } catch (error) {
    console.error("Error en el proceso de solicitud de restablecimiento de contraseña:", error);
    res.status(500).json({ message: "Error del servidor", error });
  }
};


const getEmployeesAndOwners = async (req, res) => {
  try {
    const users = await User.find(); // Fetch all users
    res.json(users); // Send all users in the response
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  getEmployeesAndOwners,
  profile,
  register,
  login,
  getEmployee,
  googleLogin,
  facebookLogin,
  logout,
  updateProfile,
  requestPasswordReset,
};
