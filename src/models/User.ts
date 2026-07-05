import { Schema, model } from "mongoose";
import bcrypt from "bcryptjs";
import { IBookmark } from "@/types/bookmark.type";
import { IUserSettings } from "@/types/user-setting.type";
import { IUser } from "@/types/user.type";

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

const UserSettingsSchema = new Schema<IUserSettings>(
  {
    theme: {
      type: String,
      enum: ["light", "dark", "system"],
      default: "light",
    },
    notificationsEnabled: {
      type: Boolean,
      default: true,
    },
    preferredCategories: {
      type: [String],
      default: [],
    },
  },
  { _id: false },
);

const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    confirmPassword: {
      type: String,
      required: true,
    },
    dateOfBirth: {
      type: Date,
      default: null,
      required: false,
    },
    gender: {
      type: String,
      default: null,
      required: false,
    },
    profileImage: {
      type: String,
      default: null,
      required: false,
    },
    bookmarks: {
      type: [BookmarkSchema],
      default: [],
    },
    settings: {
      type: UserSettingsSchema,
      default: () => ({}),
    },
  },
  {
    timestamps: true,
  },
);

UserSchema.pre("save", async function (this: IUser) {
  if (!this.isModified("password") || !this.password) {
    return;
  }
  if (!this.isModified("confirmPassword") || !this.confirmPassword) {
    return;
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);

  const confirmSalt = await bcrypt.genSalt(10);
  this.confirmPassword = await bcrypt.hash(this.confirmPassword, confirmSalt);
});

// Compare password method
UserSchema.methods.comparePassword = async function (
  password: string,
): Promise<boolean> {
  if (!this.password) return false;
  return bcrypt.compare(password, this.password);
};

export const User = model<IUser>("User", UserSchema);
