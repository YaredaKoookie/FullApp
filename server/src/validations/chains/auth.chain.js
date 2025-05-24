import { body, cookie, header, param, query } from "express-validator";
import jwt from "jsonwebtoken";

export const validateEmailToken = [
  body("token").notEmpty().withMessage("code is required"),
];

export const validateChangePassword = [
  body("currentPassword")
    .notEmpty().withMessage("Current password is required")
    .isLength({ min: 8 }).withMessage("Current password must be at least 8 characters"),

  body("newPassword")
    .notEmpty().withMessage("New password is required")
    .isLength({ min: 12 }).withMessage("Password must be at least 12 characters long")
    .matches(/[A-Z]/).withMessage("Must contain at least one uppercase letter (A-Z)")
    .matches(/[a-z]/).withMessage("Must contain at least one lowercase letter (a-z)")
    .matches(/[0-9]/).withMessage("Must contain at least one number (0-9)")
    // Expanded special characters: !@#$%^&*()_+\-=[\]{};':"\\|,.<>/?
    .matches(/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/)
      .withMessage("Must contain at least one special character (!@#$%^&* etc.)")
    .not().matches(/^$|\s+/).withMessage("Password cannot contain spaces")
    .custom((value, { req }) => value !== req.body.currentPassword)
      .withMessage("New password must be different from current password")
    // Additional security checks
    .custom(value => !/(.)\1\1/.test(value))
      .withMessage("Password cannot contain 3 repeating characters in a row")
    .isLength({ max: 128 }).withMessage("Password cannot exceed 128 characters"),

  body("confirmPassword")
    .notEmpty().withMessage("Please confirm your new password")
    .custom((value, { req }) => value === req.body.newPassword)
      .withMessage("Passwords do not match")
];

export const validateSetPassword = [
  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long")
]; 

export const validateGoogleCode = [
  body("code").notEmpty().withMessage("code is required"),
  body("state").optional().isBase64().withMessage("invalid state"),
];

export const validateAccessToken = [
  header("authorization")
    .notEmpty()
    .withMessage("Authorization header is required")
    .matches(/^Bearer\s[\w-]*\.[\w-]*\.[\w-]*$/)
    .withMessage("Authorization header must be a valid Bearer token"),
];

export const validateRefreshToken = [
  cookie("refreshToken")
    .notEmpty()
    .withMessage("Refresh token is required")
    .custom((token) => {
      try {
        jwt.decode(token);
        return true;
      } catch {
        throw new Error("Refresh token must be a valid JWT");
      }
    }),
];

export const validateLogoutSession = [
  param("sessionId")
    .notEmpty()
    .withMessage("session id is required")
    .matches(/^[a-f\d]{24}$/i)
    .withMessage("Invalid id provided"),
];

export const validateLogin = [
  body("email")
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Email must be a valid email address"),
  body("password").notEmpty().withMessage("Password is required"),
];

export const validateRegister = [
  body("email")
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Email must be a valid email address"),
  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long"),
  body("role")
    .notEmpty()
    .withMessage("Role is required")
    .isIn(["doctor", "patient"])
    .withMessage("Role must be doctor or patient"),
];

export const validateEmail = [
  body("email")
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Email must be a valid email address")
    .bail(),
];

export const validatePasswordReset = [
  body("token").notEmpty().withMessage("token is required"),
  body("password")
    .notEmpty()
    .withMessage("Password is required")
];
