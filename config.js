const isDev = process.env.NODE_ENV === "development";


const ORIGIN_URL = process.env.ORIGIN_URL //: "http://localhost:8081";
const NODEMAILER_EMAIL = process.env.NODEMAILER_EMAIL;
const NODEMAILER_PASS = process.env.NODEMAILER_PASS;
const BRAND_EMAIL = process.env.BRAND_EMAIL;
const MONGO_URI = `${process.env.MONGO_URI}` //: "mongodb://localhost:27017/auth-api";

module.exports = {
  MONGO_URI,
  BRAND_EMAIL,
  ORIGIN_URL,
  NODEMAILER_EMAIL,
  NODEMAILER_PASS,
  isDev
};
