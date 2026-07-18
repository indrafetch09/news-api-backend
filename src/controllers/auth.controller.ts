import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { User } from "../models/User";

const JWT_SECRET = process.env.JWT_SECRET || "supersecretjwtkey";
const JWT_EXPIRES_IN = "90d"; // 90 days expiration for mobile session

// Generate token
const generateToken = (userId: string): string => {
  return jwt.sign({ userId }, `${JWT_SECRET}`, { expiresIn: JWT_EXPIRES_IN });
};

// POST: Register
export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password, confirmPassword } = req.body;

    const requiredFields = [
      { value: name, message: "Name is required" },
      { value: email, message: "Email is required" },
      { value: password, message: "Password is required" },
      { value: confirmPassword, message: "Confirm password is required" },
    ];

    for (const field of requiredFields) {
      if (!field.value) {
        return res.status(400).json({ message: field.message });
      }
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: "Email is already registered" });
    }

    const user = new User({ name, email, password, confirmPassword });
    await user.save();

    const token = generateToken(user._id.toString());

    return res.status(201).json({
      message: "Registration successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        profileImage: user.profileImage,
        dateOfBirth: user.dateOfBirth,
        gender: user.gender,
        settings: user.settings,
      },
    });
  } catch (error: any) {
    return res
      .status(500)
      .json({ message: error.message || "Registration failed" });
  }
};

// POST: Login
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const token = generateToken(user._id.toString());

    return res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        profileImage: user.profileImage,
        dateOfBirth: user.dateOfBirth,
        gender: user.gender,
        settings: user.settings,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ message: error.message || "Login failed" });
  }
};

// POST: Logout
export const logout = async (_req: Request, res: Response) => {
  return res.status(200).json({ message: "Logged out successfully" });
};
