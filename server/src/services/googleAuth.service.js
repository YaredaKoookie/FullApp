import { OAuth2Client } from "google-auth-library";
import { env } from "../config";
import User from "../models/user.model";
import { ServerError } from "../utils";

const client = new OAuth2Client({
  clientId: env.GOOGLE_CLIENT_ID,
  clientSecret: env.GOOGLE_CLIENT_SECRET,
  redirectUri: env.GOOGLE_CALLBACK_URL,
});

class GoogleAuthService {
  static getGoogleAuthUrl(statePayload) {
    statePayload = statePayload ? statePayload : {};
    const state = Buffer.from(JSON.stringify(statePayload)).toString("base64");

    const redirectUri = client.generateAuthUrl({
      access_type: "offline",
      prompt: "consent",
      scope: ["profile", "email"],
      state,
    });

    return redirectUri;
  }

  static async handleGoogleCallback(code, rawState) {
    const { tokens } = await client.getToken(code);
    const ticket = client.verifyIdToken({
      idToken: tokens.id_token,
      audience: env.GOOGLE_CLIENT_ID,
    });

    const payload = (await ticket.then()).getPayload();

    if (!payload.email) throw new Error("Email not found on google account");
    if (!payload.email_verified) throw new Error("email is not verified");

    const profileId = payload.sub;
    const email = payload.email;
    const name = payload.name || "No name";

    let state = null;
    if(rawState){
      state = JSON.parse(Buffer.from(rawState, "base64"));
    }
    console.log("parsed state", state)
    const intendedRole = ["doctor", "patient"].includes(state?.role)
      ? state.role
      : null;

    let user = await User.findByEmailOrOauthProvider(
      email,
      profileId,
      "google"
    );

    if (!user && !intendedRole)
      throw ServerError.badRequest("role is required for new users");

    if (user)
      await user.linkOauthProvider(profileId, "google", payload.picture);

    if (!user) {
      user = await User.create({
        name,
        email,
        role: intendedRole,
        isEmailVerified: true,
        isPasswordSet: false,
        isProfileComplete: false,
        avatar: payload.picture,
        oauthProviders: {
          profileId: profileId,
          provider: "google",
        },
      });

      await user.save();
    }

    return user;
  }

  static async handleGoogleTokenIdCallback(idToken, rawState){
    try {
      const ticket = await client.verifyIdToken({
        idToken,
        audience: env.GOOGLE_CLIENT_ID,
      });
  
      const payload = ticket.getPayload();
      if (!payload?.email_verified) throw new Error("Unverified email");
  
      const profileId = payload.sub;
      const email = payload.email;
      const name = payload.name || "No name";
  
      let state = null;
      if (rawState) {
        state = rawState;
      }
  
      const intendedRole = ["doctor", "patient"].includes(state?.role)
        ? state.role
        : null;
  
      let user = await User.findByEmailOrOauthProvider(email, profileId, "google");
  
      if (!user && !intendedRole) {
        throw ServerError.badRequest("role is required for new users");
      }
  
      if (user) {
        await user.linkOauthProvider(profileId, "google", payload.picture);
      }
  
      if (!user) {
        user = await User.create({
          name,
          email,
          role: intendedRole,
          isEmailVerified: true,
          isPasswordSet: false,
          isProfileComplete: false,
          avatar: payload.picture,
          oauthProviders: {
            profileId: profileId,
            provider: "google",
          },
        });
  
        await user.save();
      }
  
      return user;
    } catch (err) {
      console.error('ID token flow failed:', err);
      throw ServerError.badRequest('Invalid ID token or state');
    }
  }

  
}

export default GoogleAuthService;