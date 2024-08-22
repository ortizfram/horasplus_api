const { NODEMAILER_EMAIL, NODEMAILER_PASS } = require("../config");
const User = require("../model/User");
const mongoose = require("mongoose");

const sendEmailOrgOwner = async (ownerId, uid, subject, text, html) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: NODEMAILER_EMAIL,
        pass: NODEMAILER_PASS,
      },
    });

    let ownerEmail = User.findById({
      _id: new mongoose.Types.ObjectId(ownerId),
    });

    const mailOptions = {
      to: ownerEmail,
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
