import { Router } from "express";
import {
  getProfile,
  updateProfile,
  getSettings,
  updateSettings,
  getBookmarks,
  addBookmark,
  removeBookmark,
  deleteAccount,
} from "../controllers/user.controller";
import { authenticate } from "../middlewares/auth.middleware";

const router = Router();

// All user profile, settings, and bookmarks routes require authentication
router.use(authenticate);

router.get("/profile", getProfile);
router.put("/profile", updateProfile);
router.delete("/profile", deleteAccount);

router.get("/settings", getSettings);
router.put("/settings", updateSettings);

router.get("/bookmarks", getBookmarks);
router.post("/bookmarks", addBookmark);
router.delete("/bookmarks/:slug", removeBookmark);

export default router;
