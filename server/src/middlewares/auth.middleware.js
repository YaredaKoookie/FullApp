import jwt from "jsonwebtoken";
import { ServerError } from "../utils";
import { env } from "../config";
import User from "../models/user.model";
import Patient from "../models/patient/patient.model";
import Doctor from "../models/doctors/doctor.model";

export const verifyJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw ServerError.unauthorized("Unauthorized: No token provided");
  }
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    throw ServerError.unauthorized("Unauthorized: Invalid token");
  }
};

export const verifyRefreshToken = (req, res, next) => {
  const token = req.cookies?.refreshToken;

  console.log("token", token);
  if (!token) {
    throw ServerError.unauthorized("Unauthorized: No refresh token provided");
  }

  try {
    const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET);
    req.user = decoded;
    console.log("Refresh Token Decoded", decoded);
    next();
  } catch (error) {
    console.log("refresh token error", error);
    throw ServerError.unauthorized("Unauthorized: Invalid refresh token");
  }
};

export const isDoctor = [
  verifyJWT,
  (req, res, next) => {
    if (req.user.role === "doctor") return next();
    next(ServerError.forbidden("Access Denied"));
  },
];

export const isPatient = [
  verifyJWT,
  (req, res, next) => {
    if (req.user.role === "patient") return next();
    next(ServerError.forbidden("Access Denied"));
  },
];

export const isAdmin = [
  verifyJWT,
  (req, res, next) => {
    if (req.user.role === "admin") return next();
    next(ServerError.forbidden("Access Denied"));
  },
];

export const isProfileCompleted = async (req, res, next) => {
  try {
    let hasProfile = false;

    if(!req.user.sub)
      throw ServerError.badRequest("user not found");

    if (req.user.role === "patient") {
      hasProfile = await Patient.exists({ user: req.user.sub });
    } else if (req.user.role === "doctor") {
      hasProfile = await Doctor.exists({ userId: req.user.sub });
    } else throw ServerError.forbidden("malformed credential");

    if (!hasProfile)
      throw ServerError.forbidden(
        "Access Denied! you need to complete your profile"
      );

    next();
  } catch (error) {
    next(error);
  }
};
