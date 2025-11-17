import { Schema, model, Document } from "mongoose";

export interface IUser extends Document {
  name?: string;
  email: string;
  password: string;
  googleId?: string;
  githubId?: string;
  profilePicture?: string;
  isEmailVerified?: boolean;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true, minlength: 8 },
    // OAuth fields (optional, for future)
    googleId: { type: String, unique: true, sparse: true },
    githubId: { type: String, unique: true, sparse: true },
    profilePicture: { type: String },
    isEmailVerified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const User = model<IUser>("User", UserSchema);