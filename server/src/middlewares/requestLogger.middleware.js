import morgan from "morgan";
import logger from "../utils/logger.util";
import { env } from "../config";
const stream = {
  write: message => logger.http(message.trim())
};

const defaultFormat = env.isDev ? "short" : "combined"
const requestLogger = (format = defaultFormat) => {
  return morgan(format, {
    stream
  });
};
export default requestLogger;