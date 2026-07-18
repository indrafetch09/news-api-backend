import { Schema, model } from "mongoose";
import bcrypt from "bcryptjs";
import { BookmarkSchema } from "./Bookmark";
import { UserSettingsSchema } from "./UserSettings";
import { IUser } from "@/types/user.type";

const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    dateOfBirth: {
      type: Date,
      default: null,
      required: false,
    },
    gender: {
      type: String,
      required: false,
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
    profileImage: {
      type: String,
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
