import jwt from "jsonwebtoken";
import Admin from "../models/admin.model.js";
import { ServerError } from "../utils";
import { env } from "../config";

export const verifyAdminJWT = async (req, res, next) => {
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];
  
  if (!authHeader?.startsWith("Bearer ")) {
    throw ServerError.unauthorized("Admin token required");
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, env.JWT_ADMIN_SECRET);
    const admin = await Admin.findOne({
      _id: decoded._id,
      isActive: true
    }).select('-password');

    if (!admin) {
      throw ServerError.unauthorized("Admin account not found");
    }

    req.admin = admin; // Attach admin to request
    next();
  } catch (error) {
    throw ServerError.unauthorized("Invalid admin token");
  }
};

export const requireSuperAdmin = [
  verifyAdminJWT,
  (req, res, next) => {
    if (req.admin.role === "super-admin") return next();
    next(ServerError.forbidden("Super admin privileges required"));
  }
];

export const hasAdminPermission = (permission) => [
  verifyAdminJWT,
  (req, res, next) => {
    if (
      req.admin.permissions.includes("all") || 
      req.admin.permissions.includes(permission)
    ) {
      return next();
    }
    next(ServerError.forbidden(`Requires ${permission} permission`));
  }
];