import crypto, { verify } from "crypto";
import { env } from "../config";
import { ServerError } from "../utils";

const verifyChapaSignature = (req, res, next) => {
  const payload = JSON.stringify(req.body);
  const signature = req.headers["Chapa-Signature"];

  console.log("chapa payload", payload);
  console.log("chapa signature", signature);

  if (!signature || !payload) throw ServerError.badRequest("Invalid request");

  const expectedSignature = crypto
    .createHmac("sha256", env.CHAPA_WEBHOOK_SECRET_KEY)
    .update(payload)
    .digest("hex");

  if (expectedSignature !== signature) {
    return next(ServerError.badRequest("Invalid signature"));
  }

  next();
};

export default verifyChapaSignature;