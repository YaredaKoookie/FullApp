import express from "express";
import {
  verifyAdminJWT,
  requireSuperAdmin,
  hasAdminPermission
} from "../middleware/adminAuth.js";
import {
  adminLogin,
  createSubAdmin,
  manageUsers,
  getSystemAnalytics
} from "../controllers/admin.controller.js";

const router = express.Router();

// Authentication
router.post("/login", adminLogin);
router.post("/refresh-token", refreshAdminToken);

// Admin management (super-admin only)
router.post("/sub-admins", requireSuperAdmin, createSubAdmin);
router.patch("/sub-admins/:id", requireSuperAdmin, updateSubAdmin);

// User management
router.get("/users", hasAdminPermission("manage-users"), manageUsers);
router.patch("/users/:id/status", hasAdminPermission("manage-users"), toggleUserStatus);

// Analytics
router.get("/analytics", hasAdminPermission("view-analytics"), getSystemAnalytics);

export default router;