import { IBookmark } from "./bookmark.type";
import { IUserSettings } from "./user-setting.type";
import { Document } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  profileImage?: string;
  bookmarks: IBookmark[];
  settings: IUserSettings;
  dateOfBirth?: Date | null;
  gender?: string;
  comparePassword(password: string): Promise<boolean>;
}
