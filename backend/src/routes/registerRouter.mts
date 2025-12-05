import express from "express";
import { createUser } from "../controllers/registerController.mjs";

export const registerRouter = express.Router();

export type RegisterRequest = {
  name: string;
  email: string;
  password: string;
};

registerRouter.post("/", async (req, res) => {
  try {
    const { name, email, password }: RegisterRequest = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({
        error: "Validation failed",
        details: {
          name: !name ? "Name is required" : undefined,
          email: !email ? "Email is required" : undefined,
          password: !password ? "Password is required" : undefined,
        },
      });
    }

    // Validate field types
    if (typeof name !== "string" || typeof email !== "string" || typeof password !== "string") {
      return res.status(400).json({
        error: "Invalid field types",
        details: "Name, email, and password must be strings",
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: "Invalid email format",
        details: "Please provide a valid email address",
      });
    }

     // Create the user
    const newUser = await createUser({ name, email, password });
    
    return res.status(201).json({
      message: "User registered successfully",
      user: newUser,
    });
  } catch (error: any) {
    console.error("Registration error:", error);
    
    // Handle specific error cases
    if (error.message?.includes("duplicate") || error.message?.includes("already exists")) {
      return res.status(409).json({
        error: "User already exists",
        details: "A user with this email is already registered",
      });
    }
    
    return res.status(500).json({
      error: "Internal server error",
      details: "An unexpected error occurred during registration",
    });
  }
});