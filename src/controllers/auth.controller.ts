import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { User } from "../models/User";

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = "30d"; // 30 days expiration for mobile session

const generateToken = (userId: string): string => {
  return jwt.sign({ userId }, `${JWT_SECRET}`, { expiresIn: JWT_EXPIRES_IN });
};

export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ message: "Name, email, and password are required" });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: "Email is already registered" });
    }

    const user = new User({ name, email, password });
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
        settings: user.settings,
      },
    });
  } catch (error: any) {
    return res
      .status(500)
      .json({ message: error.message || "Registration failed" });
  }
};

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
        settings: user.settings,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ message: error.message || "Login failed" });
  }
};

export const logout = async (_req: Request, res: Response) => {
  return res.status(200).json({ message: "Logged out successfully" });
};
