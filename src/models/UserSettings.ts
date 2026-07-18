import { Schema } from "mongoose";
import { IUserSettings } from "@/types/user-setting.type";

// ponytail: Extracted to satisfy request, though normally YAGNI if only used by User.
export const UserSettingsSchema = new Schema<IUserSettings>(
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
