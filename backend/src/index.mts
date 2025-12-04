import express, { Request, Response  } from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

const port = process.env.PORT || 3001;
const dbUrl = process.env.URL;

if (!dbUrl) throw Error("no db URL");

app.get("/ping", (req, res) => {
  res.status(200).json({ status: "api is working" });
});

app.listen(port, async () => {
  try {
    await mongoose.connect(dbUrl);
    console.log(`Server running on port: ${port}`);
  } catch (error) {
    console.log(error);
  }
});