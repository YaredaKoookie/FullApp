import jwt from "jsonwebtoken";
import crypt from "crypto"
import { env } from "../config";

export const generateAccessToken = (user) => {
  return jwt.sign(
    {
      sub: user._id,
      role: user.role,
    },
    env.JWT_ACCESS_SECRET,
    {
      expiresIn: "3h",
    }
  );
};

export const generateRefreshToken = (user, session) => {
  return jwt.sign(
    {
      sub: user._id,
      role: user.role,
      sessionId: session._id,
    },
    env.JWT_REFRESH_SECRET,
    {
      expiresIn: "7d",
    }
  );
};

export const generateUniqueToken = () => {
    return crypto.randomUUID().toString("hex");
}