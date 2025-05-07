import { Router } from "express";
import { authChains, validate } from "../validations";
import { authController } from "../controllers";
import { authMiddleware } from "../middlewares";
import { logout } from "../controllers/auth.controller";

const router = Router();

// route for manual register and login (email + password)
router.post(
  "/register",
  validate(authChains.validateRegister),
  authController.registerWithEmailAndPassword
);

router.post(
  "/login",
  validate(authChains.validateLogin),
  authController.loginWithEmail
);

// route for verify email
router.post("/email/verify", authController.verifyEmail);

// route for google oauth
router.post("/magic-link", authController.requestMagicLink);

router.post("/magic-link/verify", authController.verifyMagicLinkToken);

router.post("/google/url", authController.getGoogleAuthUrl);

router.post(
  "/google/callback",
  validate(authChains.validateGoogleCode),
  authController.googleAuthCallback
);

router.post(
  "/google/token/callback",
  validate(authChains.validateGoogleIdToken),
  authController.GoogleTokenIdCallback
);

router.post(
  "/password-reset",
  validate(authChains.validateEmail),
  authController.requestPasswordReset
);

router.post(
  "/password-reset/confirm",
  validate(authChains.validatePasswordReset),
  authController.resetPassword
);

router.post(
  "/logout",
  authMiddleware.verifyRefreshToken,
  authController.logout
);

// refresh token
router.post(
  "/refresh",
  authMiddleware.verifyRefreshToken,
  authController.refreshToken
);

router.get(
  "/me", 
  authMiddleware.verifyJWT,
  authController.getUser
)

export default router;
