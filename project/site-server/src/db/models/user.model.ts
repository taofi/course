import { Schema, model, Document } from "mongoose";
// Определяем доступные роли
export enum UserRole {
  USER = "user",
  ADMIN = "admin"
}

export interface IUser extends Document {
  name: string;
  login: string;
  email: string;
  password: string;
  registrationDate: string;
  avatar: string;
  isEmailVerified: boolean;
  role: UserRole;
}

const UserSchema = new Schema<IUser>({
  name: { type: String, required: true },
  login: { type: String, unique: true, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  registrationDate: { type: String, required: true },
  avatar: { type: String },
  isEmailVerified: {
    type: Boolean,
    required: true, 
    default: false 
  },
  role: { 
    type: String, 
    enum: Object.values(UserRole), 
    default: UserRole.USER 
  }
});

export const User = model<IUser>("User", UserSchema);