import { env } from "../config";
import Token from "../models/token.model";
import User from "../models/user.model";
import { SessionService, GoogleAuthService } from "../services";
import { hashUtil, mail, ServerError, tokenUtil } from "../utils";

export const registerWithEmailAndPassword = async (req, res) => {
  const { email, role, password } = req.body;

  if (!email || !role || !password)
    throw ServerError.badRequest("email, password and role are required");

  const user = await User.findOne({ email });

  if (user) throw ServerError.forbidden("Email already in use.");

  const verificationToken = tokenUtil.generateUniqueToken();

  const tokenRecord = await Token.create({
    email,
    token: verificationToken,
    type: "email-verification",
    payload: {
      password: await hashUtil.hashPassword(password),
      role,
    },
  });

  const url = new URL("/auth/email/verify", env.FRONTEND_URL);
  url.searchParams.set("token", tokenRecord.token);

  await mail.sendMail({
    from: env.MAIL_FROM,
    to: email,
    subject: "Create Account",
    template: "createAccount",
    locals: {
      magicLink: url.href,
    },
  });

  res.json({
    success: true,
    message: "email verification have been sent",
  });
};

export const verifyEmail = async (req, res) => {
  const token = req.body.token;

  if (!token) throw ServerError.badRequest("token not provided");

  const tokenRecord = await Token.findOne({
    token,
    type: "email-verification",
  });

  if (!tokenRecord || tokenRecord.expiresAt < new Date())
    throw ServerError.badRequest("Invalid or expired token");

  let user = await User.findOne({ email: tokenRecord.email });

  if (!user) {
    if (!tokenRecord.payload.role)
      throw new ServerError.badRequest("role is required for new users");

    try {
      user = await User.create({
        email: tokenRecord.email,
        isEmailVerified: true,
        role: tokenRecord.payload.role,
        password: tokenRecord.payload.password,
        isPasswordSet: !!tokenRecord.payload.password,
        isProfileCompleted: false,
      });
    } catch (err) {
      if (err.code === 11000) {
        // Duplicate key error: user was likely created in a parallel request
        user = await User.findOne({ email: tokenRecord.email });
      } else {
        throw err;
      }
    }
  } else {
    user.isEmailVerified = true;
    await user.save();
  }

  const { session, refreshToken, accessToken } =
    await SessionService.createUserSession(user, req.clientIp, req.userAgent);

  res.cookie("refreshToken", refreshToken, {
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
    httpOnly: true,
    secure: true,
    sameSite: "strict",
  });

  await tokenRecord.deleteOne();

  res.json({
    success: true,
    data: {
      accessToken,
      session,
      user,
    },
  });
};

export const loginWithEmail = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select("+password");

  if (!user) throw ServerError.badRequest("User doesn't exist with that email");
  
  console.log(email, user);
  
  if (!user.isEmailVerified)
    throw ServerError.forbidden(
      "Email is not verified please use social login"
    );

  if (!user.password || !user.isPasswordSet)
    throw ServerError.forbidden(
      "No password has been set for this account, please use social login"
    );

  const valid = await hashUtil.comparePassword(password, user.password);

  if (!valid) throw ServerError.forbidden("invalid credentials");

  const { session, refreshToken, accessToken } =
    await SessionService.createUserSession(user, req.clientIp, req.userAgent);

  res.cookie("refreshToken", refreshToken, {
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
    httpOnly: true,
    secure: true,
    sameSite: "strict",
  });

  res.json({
    success: true,
    data: {
      accessToken,
      session,
      user,
    },
  });
};

export const requestMagicLink = async (req, res) => {
  if (!req.body.email) throw ServerError.badRequest("email is required");

  const { email, role } = req.body;

  const verificationToken = tokenUtil.generateUniqueToken();
  const user = await User.exists({ email });

  if (!user && !role)
    throw ServerError.badRequest("role is required for new users");

  await Token.create({
    email,
    token: verificationToken,
    type: "magic-link",
    payload: {
      role,
    },
  });

  const url = new URL("/auth/magic-link/verify", env.FRONTEND_URL);
  url.searchParams.set("token", verificationToken);

  await mail.sendMail({
    from: env.MAIL_FROM,
    to: email,
    subject: user ? "Login to DAP" : "Create Account",
    template: user ? "login" : "createAccount",
    locals: {
      magicLink: url.href,
    },
  });

  res.json({
    success: true,
    message: "Magic link has been sent successfully",
  });
};

export const verifyMagicLinkToken = async (req, res) => {
  const token = req.body.token;

  if (!token) throw ServerError.badRequest("token is required");

  const tokenRecord = await Token.findOne({ token, type: "magic-link" });

  if (!tokenRecord || tokenRecord.expiresAt < new Date())
    throw ServerError.badRequest("invalid or expired token");

  console.log("verify magic link token", tokenRecord);

  let user = await User.findOne({ email: tokenRecord.email });

  if (!user) {
    try {
      user = await User.create({
        email: tokenRecord.email,
        role: tokenRecord.payload.role,
        isEmailVerified: true,
        isProfileCompleted: false,
        isPasswordSet: false,
      });
    } catch (err) {
      if (err.code === 11000) {
        // Duplicate key error: user was likely created in a parallel request
        user = await User.findOne({ email: tokenRecord.email });
      } else {
        throw err;
      }
    }
  }

  const { session, refreshToken, accessToken } =
    await SessionService.createUserSession(user, req.clientIp, req.userAgent);

  res.cookie("refreshToken", refreshToken, {
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
    httpOnly: true,
    secure: true,
    sameSite: "strict",
  });

  await tokenRecord.deleteOne();

  res.json({
    success: true,
    data: {
      accessToken,
      session,
      user,
    },
  });
};

// Removed duplicate declaration of getGoogleAuthUrl

export const googleAuthCallback = async (req, res) => {
  const code = req.body.code;
  const state = req.body.state;

  console.log("state callback", state);

  const user = await GoogleAuthService.handleGoogleCallback(code, state);

  const { accessToken, refreshToken, session } =
    await SessionService.createUserSession(user, req.clientIp, req.userAgent);

  res.cookie("refreshToken", refreshToken, {
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
    httpOnly: true,
    secure: true,
    sameSite: "strict",
  });

  res.json({
    success: true,
    data: {
      accessToken,
      session,
      user,
    },
  });
};

export const getGoogleAuthUrl = async (req, res) => {
  const url = GoogleAuthService.getGoogleAuthUrl(req.body?.state);

  console.log("google state", req.body.state);
  console.log("google url", url);

  res.json({
    success: true,
    url,
  });
};

export const GoogleTokenIdCallback = async (req, res) => {
  const idToken = req.body.idToken;
  const state = req.body.state;

  console.log("id token", idToken);
  console.log("state callback", state);

  const user = await GoogleAuthService.handleGoogleTokenIdCallback(
    idToken,
    state
  );

  console.log(user);

  const { accessToken, refreshToken, session } =
    await SessionService.createUserSession(user, req.clientIp, req.userAgent);
  console.log(accessToken, refreshToken);

  res.cookie("refreshToken", refreshToken, {
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
    httpOnly: true,
    secure: true,
    sameSite: "strict",
  });

  res.json({
    success: true,
    data: {
      accessToken,
      session,
      user,
    },
  });
};

export const logout = async (req, res) => {
  const { sessionId } = req.user;

  console.log("sessionId", sessionId);

  const session = await SessionService.deleteSessionById(sessionId);

  if (!session) {
    console.warn("Session not found for sessionId:", sessionId);
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: true,
      sameSite: "Strict",
    });
    return res.json({
      success: true,
      message: "Session already logged out",
    });
  }

  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: true,
    sameSite: "Strict",
  });

  res.json({
    success: true,
    message: "Logged out successfully",
  });
};

export const requestPasswordReset = async (req, res) => {
  const email = req.body.email;

  if (!email) throw ServerError.badRequest("email is required");

  const user = await User.findOne({ email });

  if (!user) throw ServerError.notFound("User not found");

  const passwordResetToken = tokenUtil.generateUniqueToken();

  await Token.create({
    email: user.email,
    user: user._id,
    token: passwordResetToken,
    type: "password-reset",
  });

  const url = new URL("/auth/reset-password", env.FRONTEND_URL);
  url.searchParams.set("token", passwordResetToken);

  await mail.sendMail({
    from: env.MAIL_FROM,
    to: email,
    subject: "Reset Password",
    template: "resetPassword",
    locals: {
      magicLink: url.href,
    },
  });

  res.json({
    success: true,
    message: "Password reset link sent to email",
  });
};

export const resetPassword = async (req, res) => {
  const { token, password } = req.body;

  const tokenRecord = await Token.findOne({
    token,
    type: "password-reset",
  });

  if (!tokenRecord) throw ServerError.badRequest("expired or invalid token");

  const user = await User.findById(tokenRecord.user);

  if (!user) throw ServerError.notFound("User not found");

  const hashedPassword = await hashUtil.hashPassword(password);

  user.password = hashedPassword;
  user.isPasswordSet = true;

  await user.save();

  await tokenRecord.deleteOne();

  res.json({
    success: true,
    message: "Password has been reset successfully",
  });
};

export const refreshToken = async (req, res) => {
  const { sub: userId, sessionId } = req.user;
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) throw ServerError.badRequest("Refresh token is required");

  const user = await User.findById(userId);

  if (!user) throw ServerError.notFound("User not found");

  const session = await SessionService.getSessionById(sessionId);

  if (!session) throw ServerError.notFound("Session not found");

  const isValidToken = await session.isValidRefreshToken(refreshToken);

  if (!isValidToken) throw ServerError.forbidden("Invalid token");

  const accessToken = tokenUtil.generateAccessToken(user);

  res.json({
    success: true,
    data: {
      accessToken,
    },
  });
};

export const getUser = async (req, res) => {
  const {sub: userId, role} = req.user;

  const user = await User.findById(userId);
 
  if(!user) throw ServerError.notFound("User not found");

  if(user.role !== role) throw ServerError.badRequest("Access Denied mismatched role");

  res.json({
    success: true,
    data: {
      user
    }
  })
}