import express from "express";
import { Request, Response } from "express";
import { login } from "../controllers/loginController.mjs";
import Jwt from "jsonwebtoken";

export const loginRouter = express.Router();

loginRouter.post("/", async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      res.status(400).json({ message: "missing email or password in body" });
    } else {
      const loggedInUser = await login(email, password);

      if (!loggedInUser) {
        res.status(400).json({ message: "incorrect email or password" });
      } else {
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) throw new Error("JWT_SECRET not configured");
        
        const token = Jwt.sign(loggedInUser, jwtSecret);

        const currentDate = new Date();
        currentDate.setDate(currentDate.getDate() + 7); // 7 days

        res.cookie("login", token, { 
          expires: currentDate,
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax"
        });
        res.status(200).json(loggedInUser);
      }
    }
  } catch (error: any) {
    res.status(500).json(error.message);
  }
});
