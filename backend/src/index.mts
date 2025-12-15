import express, { Request, Response } from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import { createServer } from "http";
import { Server } from "socket.io";
import { registerRouter } from "./routes/registerRouter.mjs";
import { loginRouter } from "./routes/loginRouter.mjs";
import { authRouter } from "./routes/authRouter.mjs";
import { groupRouter } from "./routes/groupRouter.mjs";
import { expenseRouter } from "./routes/expenseRouter.mjs";
import { auth } from "./middlewares/auth.mjs";

dotenv.config();

const app = express();
const httpServer = createServer(app);

// Socket.IO setup
export const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  },
});

// Socket.IO connection handling
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // Join a group room
  socket.on("join-group", (groupId: string) => {
    socket.join(`group-${groupId}`);
    console.log(`Socket ${socket.id} joined group-${groupId}`);
  });

  // Leave a group room
  socket.on("leave-group", (groupId: string) => {
    socket.leave(`group-${groupId}`);
    console.log(`Socket ${socket.id} left group-${groupId}`);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

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
app.use("/expenses", expenseRouter);

app.get("/ping", (req, res) => {
  res.status(200).json({ status: "api is working" });
});

httpServer.listen(port, async () => {
  try {
    await mongoose.connect(dbUrl);
    console.log(`Server running on port: ${port}`);
    console.log(`Socket.IO server ready`);
  } catch (error) {
    console.log(error);
  }
});
