import uap from "ua-parser-js";
import geoIpService from "./geoip.service";
import { tokenUtil } from "../utils";
import Session from "../models/session.model";

class SessionService {
  static async createUserSession(user, ip, userAgent) {
    const parsedUserAgent = uap.UAParser(userAgent);
    const address = await geoIpService.getLocation(ip);

    await this.cleanUpOldestSessions(user._id.toString());

    const { browser, os, device, cpu, ua } = parsedUserAgent;

    const sessionData = {
      userAgent: ua,
      ip: address?.ip,
      address: address || undefined,
      device: {
        browser: browser?.name && `${browser.name} ${browser.version}`,
        os: os?.name && `${os.name} ${os.version}`,
        model: device?.model || device?.vendor,
        type: device?.type,
        cpu: cpu?.architecture,
      },
    };

    if (address?.lat && address?.lon) {
      sessionData.location = {
        type: "Point",
        coordinates: [address.lon, address.lat],
      };
    }

    sessionData.user = user._id;

    const session = new Session(sessionData);

    console.log("session", )

    const refreshToken = tokenUtil.generateRefreshToken(user, session);

    session.refreshToken = refreshToken;
    await session.save();

    const accessToken = tokenUtil.generateAccessToken(user);

    return { session, refreshToken, accessToken };
  }

  static async getSessionById(id){
    return Session.findById(id);
  }

  static async cleanUpOldestSessions(id) {
    const oldestSessions = await Session.findOldestByUserId(id, 5);

    if (oldestSessions.length > 0) {
      const ids = oldestSessions.map((s) => s._id.toString());
      await Session.deleteMany({ _id: { $in: ids } });
    }
  }

  static async deleteSessionById(id){
    return Session.findByIdAndDelete(id);
  }
}

export default SessionService;
