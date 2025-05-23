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
  "/change-password",
  authMiddleware.verifyJWT,
  authMiddleware.verifyRefreshToken,
  validate(authChains.validateChangePassword),
  authController.changePassword
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

router.post(
  "/set-password",
  authMiddleware.verifyJWT,
  authMiddleware.verifyRefreshToken,
  validate(authChains.validateSetPassword),
  authController.setPassword
);

router.get(
  "/me",
  authMiddleware.verifyJWT,
  authController.getUser
)

router.get(
  "/sessions",
  authMiddleware.verifyRefreshToken,
  authController.getSessions
)

router.delete(
  "/sessions/:sessionId",
  authMiddleware.verifyJWT,
  authMiddleware.verifyRefreshToken,
  authController.logoutFromSession
)

router.delete(
  "/sessions",
  authMiddleware.verifyJWT,
  authMiddleware.verifyRefreshToken,
  authController.logoutFromAllSessions
)

export default router;
