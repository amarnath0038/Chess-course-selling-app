require("dotenv").config(); // To load environment variables from .env file

const express = require("express");
const mongoose = require("mongoose");

const app = express();
app.use(express.json());

const { adminRouter } = require("./routes/admin");
const { userRouter } = require("./routes/user");
const { courseRouter } = require("./routes/course");


app.use("/api/v1/admin", adminRouter);

app.use("/api/v1/user", userRouter);

app.use("/api/v1/course", courseRouter);


const PORT = process.env.PORT || 3000;
const MONGODB_URL = process.env.MONGODB_URL;


async function main() {
  try {
    await mongoose.connect(MONGODB_URL);
    console.log("Connected to database successfully");
    app.listen(PORT, () => { 
      console.log(`Listening on PORT : ${PORT}`);
    });
  } catch(error) {
    console.error("Error connecting to database", error);
    process.exit(1); // Exit if connection fails
  }
}


// To initiate server and database connection
main(); 