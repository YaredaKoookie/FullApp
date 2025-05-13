import { Schema, model } from "mongoose";

const adminSchema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  fullName: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ["admin", "super-admin"],
    default: "admin"
  },
  permissions: {
    type: [String],
    enum: [
      "manage-users", 
      "manage-content",
      "manage-settings",
      "view-analytics",
      "all"
    ],
    default: ["view-analytics"]
  },
  lastLogin: Date,
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

export default model("Admin", adminSchema);