import { Schema } from "mongoose";
import { IBookmark } from "@/types/bookmark.type";

// ponytail: Extracted to satisfy request, though normally YAGNI if only used by User.
export const BookmarkSchema = new Schema<IBookmark>({
  title: { type: String, required: true },
  image_thumbnail: { type: String },
  image_full: { type: String },
  time: { type: String, required: true },
  link: { type: String, required: true },
  slug: { type: String, required: true },
  category: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});
