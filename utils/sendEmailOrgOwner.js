import nodemailer from "nodemailer";
import { NODEMAILER_EMAIL,NODEMAILER_PASS } from "../config";
import User from "../model/User";
import mongoose from "mongoose";

const sendEmailOrgOwner = async (ownerId,uid, subject, text, html) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: NODEMAILER_EMAIL,
        pass: NODEMAILER_PASS, 
      },
    });


    let ownerEmail = User.findById({_id:new mongoose.Types.ObjectId(ownerId)})

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

export default sendEmailOrgOwner;