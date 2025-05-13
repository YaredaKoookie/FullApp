// controllers/admin.controller.js
import jwt from "jsonwebtoken";
import Admin from "../models/admin.model.js";
import { env } from "../config";
import { ServerError } from "../utils";

export const adminLogin = async (req, res) => {
  const { email, password } = req.body;

  try {
    const admin = await Admin.findOne({ email });
    if (!admin || !(await admin.comparePassword(password))) {
      throw ServerError.unauthorized("Invalid credentials");
    }

    const accessToken = jwt.sign(
      { _id: admin._id, role: admin.role },
      env.JWT_ADMIN_SECRET,
      { expiresIn: "15m" }
    );

    const refreshToken = jwt.sign(
      { _id: admin._id },
      env.JWT_ADMIN_REFRESH_SECRET,
      { expiresIn: "7d" }
    );

    // Update last login
    admin.lastLogin = new Date();
    await admin.save();

    res.cookie("adminRefreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.json({
      success: true,
      accessToken,
      admin: {
        _id: admin._id,
        fullName: admin.fullName,
        role: admin.role,
        permissions: admin.permissions
      }
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message
    });
  }
};