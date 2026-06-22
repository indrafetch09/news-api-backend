import { Request, Response } from "express";
import { User } from "../models/User";

export const getProfile = async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    return res.status(200).json({
      id: user._id,
      name: user.name,
      email: user.email,
      profileImage: user.profileImage,
      settings: user.settings,
    });
  } catch (error: any) {
    return res.status(500).json({ message: error.message || "Failed to get profile" });
  }
};

export const updateProfile = async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const { name, email, password, profileImage } = req.body;

    if (name) user.name = name;
    if (email && email.toLowerCase() !== user.email) {
      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser) {
        return res.status(400).json({ message: "Email is already in use" });
      }
      user.email = email.toLowerCase();
    }
    if (profileImage !== undefined) user.profileImage = profileImage;
    if (password) user.password = password; // pre-save hook handles hashing

    await user.save();

    return res.status(200).json({
      message: "Profile updated successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        profileImage: user.profileImage,
        settings: user.settings,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ message: error.message || "Failed to update profile" });
  }
};

export const getSettings = async (req: Request, res: Response) => {
  try {
    return res.status(200).json(req.user!.settings);
  } catch (error: any) {
    return res.status(500).json({ message: error.message || "Failed to get settings" });
  }
};

export const updateSettings = async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const { theme, notificationsEnabled, preferredCategories } = req.body;

    if (theme !== undefined) user.settings.theme = theme;
    if (notificationsEnabled !== undefined) user.settings.notificationsEnabled = notificationsEnabled;
    if (preferredCategories !== undefined) user.settings.preferredCategories = preferredCategories;

    await user.save();

    return res.status(200).json({
      message: "Settings updated successfully",
      settings: user.settings,
    });
  } catch (error: any) {
    return res.status(500).json({ message: error.message || "Failed to update settings" });
  }
};

export const getBookmarks = async (req: Request, res: Response) => {
  try {
    return res.status(200).json(req.user!.bookmarks);
  } catch (error: any) {
    return res.status(500).json({ message: error.message || "Failed to get bookmarks" });
  }
};

export const addBookmark = async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const { title, image_thumbnail, image_full, time, link, slug, category } = req.body;

    if (!title || !time || !link || !slug || !category) {
      return res.status(400).json({ message: "Article title, time, link, slug, and category are required" });
    }

    const isBookmarked = user.bookmarks.some((b) => b.slug === slug);
    if (isBookmarked) {
      return res.status(400).json({ message: "Article is already bookmarked" });
    }

    user.bookmarks.push({
      title,
      image_thumbnail,
      image_full,
      time,
      link,
      slug,
      category,
      createdAt: new Date(),
    });

    await user.save();

    return res.status(201).json({
      message: "Bookmark added successfully",
      bookmarks: user.bookmarks,
    });
  } catch (error: any) {
    return res.status(500).json({ message: error.message || "Failed to add bookmark" });
  }
};

export const removeBookmark = async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const { slug } = req.params;

    if (!slug) {
      return res.status(400).json({ message: "Article slug is required" });
    }

    const bookmarkIndex = user.bookmarks.findIndex((b) => b.slug === slug);
    if (bookmarkIndex === -1) {
      return res.status(404).json({ message: "Bookmark not found" });
    }

    user.bookmarks.splice(bookmarkIndex, 1);
    await user.save();

    return res.status(200).json({
      message: "Bookmark removed successfully",
      bookmarks: user.bookmarks,
    });
  } catch (error: any) {
    return res.status(500).json({ message: error.message || "Failed to remove bookmark" });
  }
};
