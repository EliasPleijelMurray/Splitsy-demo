import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { UserDto } from "../models/userDto.mjs";
import User from "../models/userSchema.mjs";

export const auth = async (req: Request, res: Response, next: NextFunction) => {
  const loginCookie = req.cookies["login"];

  if (!loginCookie) {
    return res.status(401).json({ message: "No authentication token" });
  }

  try {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) throw new Error("JWT_SECRET not configured");

    const result = jwt.verify(loginCookie, jwtSecret);
    const theUser: UserDto = result as UserDto;

    const userFromDb = await User.findOne({ email: theUser.email });

    if (userFromDb) {
      // Attach userId to request for use in routes
      req.userId = userFromDb._id.toString();

      next();
    } else {
      return res.status(403).json({ message: "User not found in database" });
    }
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};
