import { Router, Request, Response } from "express";
import jwt from "jsonwebtoken";
import User from "../models/userSchema.mjs";

export const authRouter = Router();

// Logout endpoint
authRouter.post("/logout", (req: Request, res: Response) => {
  res.clearCookie("login", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });
  res.status(200).json({ message: "Logged out successfully" });
});

// Get current user endpoint
authRouter.get("/me", async (req: Request, res: Response) => {
  const loginCookie = req.cookies["login"];

  if (!loginCookie) {
    return res.status(401).json({ message: "Not authenticated" });
  }

  try {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) throw new Error("JWT_SECRET not configured");

    const result = jwt.verify(loginCookie, jwtSecret);
    const theUser = result as any;

    const userFromDb = await User.findOne({ email: theUser.email });

    if (userFromDb) {
      return res.status(200).json({
        id: userFromDb._id,
        name: userFromDb.name,
        email: userFromDb.email,
      });
    } else {
      return res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
});
