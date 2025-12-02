import { Redis } from "ioredis";
import { env } from "./env.js";
import logger from "./logger.js";

/**
 * Redis Connection Setup
 * Using ioredis with automatic reconnection logic.
 */
const redis = new Redis({
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  // password: env.REDIS_PASSWORD, // Uncomment if needed

  // Retry Strategy: Exponential backoff
  retryStrategy: (times: number) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },

  lazyConnect: true,
});

/**
 * Event Listeners
 */
redis.on("connect", () => {
  logger.info("[INFO] Redis: Connection established");
});

redis.on("ready", () => {
  logger.info("[INFO] Redis: Ready to accept commands");
});

redis.on("error", (err: unknown) => {
  // Explicitly cast error to access properties safely
  const error = err as { code?: string; message: string };

  if (error.code === "ECONNREFUSED") {
    logger.warn("[WARN] Redis: Connection refused, retrying...");
  } else {
    logger.error("[ERROR] Redis Error:", error);
  }
});

redis.on("reconnecting", () => {
  logger.info("[INFO] Redis: Reconnecting...");
});

// Initial connection attempt
redis.connect().catch((err: unknown) => {
  logger.error("[ERROR] Redis: Initial connection failed", err);
});

export default redis;
