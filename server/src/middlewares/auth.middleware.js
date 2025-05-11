import jwt from "jsonwebtoken";
import { ServerError } from "../utils";
import { env } from "../config";

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
    if(req.user.role === "doctor") return next();
    next(ServerError.forbidden("Access Denied"));
  }
]

export const isPatient = [
  verifyJWT, 
  (req, res, next) => {
    if(req.user.role === "patient") return next();
    next(ServerError.forbidden("Access Denied"));
  }
]

export const isProfileCompleted = [
  (req, res, next) => {
    if(!req.user.isProfileCompleted)
      throw ServerError.forbidden("Access Denied! you need to complete your profile")

    next();
  }
]