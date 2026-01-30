import { createClient } from "redis";
import { logger } from "./logger";

const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

const redisConfig: any = {
  url: redisUrl,
};

if (process.env.REDIS_PASSWORD) {
  redisConfig.password = process.env.REDIS_PASSWORD;
}

export const redis = createClient(redisConfig);

redis.on("error", (err) => {
  logger.error("Redis Client Error:", err);
});

redis.on("connect", () => {
  logger.info("Redis Client Connected");
});

redis.on("ready", () => {
  logger.info("Redis Client Ready");
});

redis.on("end", () => {
  logger.info("Redis Client Disconnected");
});

// Connect to Redis
if (process.env.NODE_ENV !== "test") {
  redis.connect().catch((err) => {
    logger.error("Failed to connect to Redis:", err);
  });
}

export default redis;
