import { Schema, model, Document } from "mongoose";
import bcrypt from "bcryptjs";

export interface IBookmark {
  title: string;
  image_thumbnail?: string;
  image_full?: string;
  time: string;
  link: string;
  slug: string;
  category: string;
  createdAt: Date;
}

export interface IUserSettings {
  theme: "light" | "dark" | "system";
  notificationsEnabled: boolean;
  preferredCategories: string[];
}

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  profileImage?: string;
  bookmarks: IBookmark[];
  settings: IUserSettings;
  comparePassword(password: string): Promise<boolean>;
}

const BookmarkSchema = new Schema<IBookmark>({
  title: { type: String, required: true },
  image_thumbnail: { type: String },
  image_full: { type: String },
  time: { type: String, required: true },
  link: { type: String, required: true },
  slug: { type: String, required: true },
  category: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const UserSettingsSchema = new Schema<IUserSettings>({
  theme: { type: String, enum: ["light", "dark", "system"], default: "light" },
  notificationsEnabled: { type: Boolean, default: true },
  preferredCategories: { type: [String], default: [] },
}, { _id: false });

const UserSchema = new Schema<IUser>({
  name: { type: String, required: true, trim: true },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: { type: String, required: true },
  profileImage: { type: String },
  bookmarks: { type: [BookmarkSchema], default: [] },
  settings: {
    type: UserSettingsSchema,
    default: () => ({}),
  },
}, {
  timestamps: true,
});

UserSchema.pre("save", async function (this: IUser) {
  if (!this.isModified("password") || !this.password) {
    return;
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password method
UserSchema.methods.comparePassword = async function (password: string): Promise<boolean> {
  if (!this.password) return false;
  return bcrypt.compare(password, this.password);
};

export const User = model<IUser>("User", UserSchema);
