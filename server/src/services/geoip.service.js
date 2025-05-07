import maxmind from "maxmind";
import path from "path";
import { logger } from "../utils";

class GeoIPService {
  lookup;
  dbPath = path.join(__dirname, "../../data/geoip/GeoLite2-City.mmdb");

  async init() {
    try {
      this.lookup = await maxmind.open(this.dbPath);
      logger.info("GeoIp database loaded successfully");
    } catch (error) {
      logger.error("Failed to load GeoIP database:", error);
      this.lookup = undefined;
    }
  }

  async getLocation(ip) {
    const LOCAL_IPS = ["127.0.0.1", "::1"];

    if (!ip || LOCAL_IPS.includes(ip)) {
      return {
        ip,
        region: "Local",
        country: "Local",
        city: "Localhost",
        lat: 0,
        lon: 0,
        source: "local",
      };
    }

    try {
      const location = await fetch(
        `https://ipinfo.io/${ip}?token=df295d165d0112`
      );
      const data = await location.json();

      if(!data.loc || data.borgan) 
        throw new Error("Invalid Ip Address or API Failed to get the location")
      
      const [lat, lon] = data.loc.split(",");

      return {
        ip: data?.ip || ip,
        city: data?.city,
        region: data?.region,
        country: data?.country,
        lat: parseFloat(lat),
        lon: parseFloat(lon),
        org: data?.org,
        timezone: data?.timezone,
        source: "ip.info",
      };
    } catch (err) {
      logger.error(
        "Ip.info failed, falling back to local database lookup",
        err
      );
    }

    if (!this.lookup) {
      logger.warn("MaxMind DB not initialized");
      return null;
    }

    const data = this.lookup.get(ip);
    if (!data) return null;
    console.log("data", data, ip);

    return {
      ip,
      city: data.city?.names?.en,
      region: data.subdivisions?.[0]?.names?.en,
      country: data.country?.iso_code,
      lat: data.location?.latitude,
      lon: data.location?.longitude,
      timezone: data.location?.time_zone,
      source: "maxmind",
    };
  }
}

// Singleton instance
const geoIpService = new GeoIPService();
export default geoIpService;