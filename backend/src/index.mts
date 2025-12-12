import express, { Request, Response } from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import { registerRouter } from "./routes/registerRouter.mjs";
import { loginRouter } from "./routes/loginRouter.mjs";
import { authRouter } from "./routes/authRouter.mjs";
import { groupRouter } from "./routes/groupRouter.mjs";
import { auth } from "./middlewares/auth.mjs";

dotenv.config();

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  })
);

const port = process.env.PORT || 3001;
const dbUrl = process.env.URL;

if (!dbUrl) throw Error("no db URL");

app.use("/register", registerRouter);
app.use("/login", loginRouter);
app.use("/", authRouter);

app.use(auth);

app.use("/groups", groupRouter);

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
