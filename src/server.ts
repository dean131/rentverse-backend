import http from "http";
import app from "./app.js";
import { env } from "./config/env.js";
import prisma from "./config/prisma.js";
import logger from "./config/logger.js";
import redis from "./config/redis.js";
import socketService from "./shared/services/socket.service.js";

import { registerTrustSubscribers } from "./modules/trust/trust.subscribers.js";
import { registerNotificationSubscribers } from "./modules/notification/notification.subscribers.js"; 
import { registerFinanceSubscribers } from "./modules/finance/finance.subscribers.js";
import { registerAuthSubscribers } from "modules/auth/auth.subscribers.js";

// [NEW] Import the Queue Worker to start listening
import "./modules/chat/chat.queue.js";

const startServer = async () => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    logger.info("[INFO] Database Connected Successfully");

    registerTrustSubscribers();
    registerNotificationSubscribers();
    registerFinanceSubscribers();
    registerAuthSubscribers();
    logger.info("[INFO] Event Subscribers Registered");

    // Create HTTP Server explicitly
    const httpServer = http.createServer(app);

    // Initialize Socket.IO
    socketService.init(httpServer);

    // Listen on httpServer, NOT app
    const server = httpServer.listen(env.PORT, () => {
      logger.info(`[INFO] Server running on port ${env.PORT}`);
      logger.info(`[INFO] Environment: ${env.NODE_ENV}`);
    });

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
          logger.error("[ERROR] Error during shutdown:", err);
          process.exit(1);
        }
      });
    };

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));
  } catch (error: unknown) {
    logger.error("[ERROR] Startup Error:", error);
    process.exit(1);
  }
};

startServer();