import { Request } from "express";
const clientInfo = () => (req, res, next) => {
  const clientIp = req.headers["x-forwarded-for"]?.toString().split(",").shift() ||
  // Check for forwarded IP
  req.socket.remoteAddress ||
  // Check socket remote address
  req.ip; // Fallback to Express's IP

  req.clientIp = clientIp || "Unknown";
  req.userAgent = req.headers["user-agent"] || req.get("User-Agent") || "Unknown";
  next();
};
export default clientInfo;