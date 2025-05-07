import { createLogger, format, transports } from "winston";
import { env } from "../config";
const logFormat = format.printf(({
  level,
  message,
  timestamp,
  stack
}) => {
  return `${timestamp} ${level}: ${stack || message}`;
});
const logger = createLogger({
  level: env.isDev ? "debug" : "info",
  format: format.combine(format.timestamp({
    format: "YYYY-MM-DD hh:mm:ss"
  }), format.errors({
    stack: true
  }), format.splat(), env.isDev ? format.colorize() : format.uncolorize(), env.isDev ? logFormat : format.json()),
  silent: env.isTest,
  transports: [new transports.Console(), ...(env.isDev ? [] : [new transports.File({
    filename: "logs/error.log",
    level: "error"
  }), new transports.File({
    filename: "logs/combined.log"
  })])],
  exceptionHandlers: [new transports.Console(), new transports.File({
    filename: "logs/exceptions.log"
  })],
  rejectionHandlers: [new transports.Console(), new transports.File({
    filename: "logs/rejections.log"
  })]
});
export default logger;