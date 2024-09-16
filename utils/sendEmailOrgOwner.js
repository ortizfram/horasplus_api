const { NODEMAILER_EMAIL, NODEMAILER_PASS } = require("../config");
const User = require("../model/User");
const mongoose = require("mongoose");
const nodemailer = require("nodemailer");

const sendEmailOrgOwner = async (ownerId, uid, subject, text, html) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: NODEMAILER_EMAIL,
        pass: NODEMAILER_PASS,
      },
    });

    // Await the result of User.findById
    let owner = await User.findById(ownerId);

    if (!owner) {
      throw new Error("Owner not found");
    }

    const mailOptions = {
      to: owner.email, // Access the owner's email
      from: NODEMAILER_EMAIL,
      subject: subject,
      text: text,
      html: html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("\n\nEmail sent\n\n");
    return info;
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
};

module.exports = sendEmailOrgOwner;
