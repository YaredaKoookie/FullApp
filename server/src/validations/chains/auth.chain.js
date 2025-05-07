import { body, cookie, header, param, query } from "express-validator";
import jwt from "jsonwebtoken";

export const validateEmailToken = [
  body("token").notEmpty().withMessage("code is required"),
];

export const validateGoogleCode = [
  body("code").notEmpty().withMessage("code is required"),
  body("state").optional().isBase64().withMessage("invalid state"),
];

export const validateGoogleIdToken = [
  body("idToken").notEmpty().withMessage("Id token is required"),
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


