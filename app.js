const express = require("express");
const mongoose = require("mongoose");
const userRouter = require("./routes/users");
const errorHandler = require("./middlewares/errorHandler");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const { ORIGIN_URL } = require("./config");
const orgRouter = require("./routes/organization.routes");
const shiftRouter = require("./routes/shift.routes");
var multer = require("multer");
const { MONGO_URI } = require("./config");

const User = require("./model/User");
const app = express();

//! Connect to mongodb
mongoose
  .connect(MONGO_URI)
  .then(() => console.log("Db connected successfully\n\n",process.cwd(),"\n\n",process.env))
  .catch((e) => console.log(e));

//! Middlewares
app.use(express.json()); //pass incoming json data from the user
// app.use(cors({ origin: ORIGIN_URL, credentials: true }));
app.use(cors({ origin: '*', credentials: true }));
app.use(cookieParser());

var upload = multer({ dest: "./uploads" });

//! Routes
app.use("/api/users", userRouter);
app.use("/api/organization", orgRouter);
app.use("/api/shift", shiftRouter);
app.post("/upload", upload.single("document"), (req, res) => {
  if (!req.file) {
    return res.status(400).send("No file uploaded.");
  }

  console.log(req.file); // Logs the file details
  console.log(req.body); // Logs any additional data (e.g., docTitle)

  res.status(200).send({
    message: "File uploaded successfully",
    file: req.file,
  });
});

//! Error handler
app.use(errorHandler);

//! Start the server
const PORT = 8000;
app.listen(PORT, () => console.log(`Server is up and running on PORT ${PORT}`));
