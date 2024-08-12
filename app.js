const express = require("express");
const mongoose = require("mongoose");
const userRouter = require("./routes/users");
const errorHandler = require("./middlewares/errorHandler");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const { ORIGIN_URL } = require("./config");
const app = express();

//! Connect to mongodb
mongoose
  .connect("mongodb://localhost:27017/auth-api")
  .then(() => console.log("Db connected successfully"))
  .catch((e) => console.log(e));

//! Middlewares
app.use(express.json()); //pass incoming json data from the user
app.use(cors({ origin: ORIGIN_URL, credentials: true }));
// app.use(cors({ origin: '*', credentials: true }));
app.use(cookieParser());

//! Routes
app.use("/api/users", userRouter);

//! Error handler
app.use(errorHandler);

//! Start the server
const PORT = 8000;
app.listen(PORT, () => console.log(`Server is up and running on PORT ${PORT}`));
