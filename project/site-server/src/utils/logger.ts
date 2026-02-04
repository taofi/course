import { AppConfig } from "@src/config";
import { createLogger, format, transports } from "winston";
const { combine, timestamp, printf, colorize } = format;


const logFormat = printf((info) => {
  return `${info.timestamp ?? new Date().toISOString()} [${info.level}]: ${info.message}`;
});

const logger = createLogger({
  level: AppConfig.NODE_ENV === "production" ? "info" : "debug",
  format: combine(timestamp(), logFormat),
  transports: [
    new transports.Console({ format: combine(colorize(), timestamp(), logFormat) }),
    new transports.File({ filename: "logs/error.log", level: "error" }),
    new transports.File({ filename: "logs/combined.log" }),
  ],
});

export default logger;
