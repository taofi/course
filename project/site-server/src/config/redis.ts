import Redis from "ioredis";
import logger from "../utils/logger";
import {AppConfig} from "./index";


const redis = new Redis(AppConfig.REDIS_URL || "redis://localhost:6379");

redis.on("connect", () => logger.info("Redis connected"));

redis.on("error", (err: Error) => {
  logger.error(`Redis error: ${err.message}`);
  throw err;
});

export default redis;
