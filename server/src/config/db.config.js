import mongoose from "mongoose";
import env from "./env.config";
import { logger } from "../utils";
export async function connect() {
  try {
    await mongoose.connect(env.DB_URL);
  } catch (error) {
    logger.error("Database connection failed", error);
  }
}
mongoose.connection.on("connected", () => {
  logger.info("Database connected successfully");
});