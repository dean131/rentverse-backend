import app from "./app.js";
import { env } from "./config/env.js";
import prisma from "./config/prisma.js";
import logger from "./config/logger.js";
import redis from "./config/redis.js";

/**
 * Start the Express Server
 */
const startServer = async () => {
  try {
    // 1. Verify Database Connection
    // Executing a raw query ensures the connection pool is active.
    await prisma.$queryRaw`SELECT 1`;
    logger.info("[INFO] Database Connected Successfully");

    // 2. Start HTTP Listener
    const server = app.listen(env.PORT, () => {
      logger.info(`[INFO] Server running on port ${env.PORT}`);
      logger.info(`[INFO] Environment: ${env.NODE_ENV}`);
      logger.info(`[INFO] Swagger Docs: http://localhost:${env.PORT}/api-docs`);
    });

    /**
     * Graceful Shutdown Logic
     * Ensures we close DB/Cache connections properly when Docker stops the container.
     */
    const shutdown = async (signal: string) => {
      logger.info(`[INFO] ${signal} received. Shutting down gracefully...`);

      server.close(async () => {
        logger.info("[INFO] HTTP Server closed.");

        try {
          await prisma.$disconnect();
          logger.info("[INFO] Database Disconnected");

          redis.disconnect();
          logger.info("[INFO] Redis Disconnected");

          process.exit(0);
        } catch (err: unknown) {
          const errorMessage = err instanceof Error ? err.message : String(err);
          logger.error("[ERROR] Error during shutdown:", {
            error: errorMessage,
          });
          process.exit(1);
        }
      });
    };

    // Listen for termination signals (e.g., Ctrl+C or Docker Stop)
    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error("[ERROR] Startup Error: Failed to initialize application.", {
      error: errorMessage,
    });
    process.exit(1); // Exit with failure code
  }
};

// Execute Startup
startServer();
