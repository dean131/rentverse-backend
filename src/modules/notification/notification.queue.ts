import { Queue, Worker, Job } from "bullmq";
import { env } from "../../config/env.js";
import prisma from "../../config/prisma.js";
import logger from "../../config/logger.js";
import { fcm } from "../../config/firebase.js";
import notificationRepository from "./notification.repository.js";

// Define Payload Interface
interface NotificationJobData {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, string>;
}

// 1. Define the Queue (Producer)
export const notificationQueue = new Queue("NotificationQueue", {
  connection: {
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
  },
  defaultJobOptions: {
    attempts: 3, // Retry 3 times if FCM fails
    backoff: {
      type: "exponential",
      delay: 1000,
    },
    removeOnComplete: true,
  },
});

// 2. Define the Worker (Consumer)
const notificationWorker = new Worker<NotificationJobData>(
  "NotificationQueue",
  async (job: Job<NotificationJobData>) => {
    const { userId, title, body, data } = job.data;

    try {
      // A. Save to Database (The History)
      const notification = await prisma.notification.create({
        data: {
          userId,
          title,
          body,
          type: data?.type || "SYSTEM",
          data: data || {},
        },
      });

      // B. Fetch Device Tokens
      const tokens = await notificationRepository.findTokensByUserId(userId);

      if (tokens.length === 0) {
        // No devices, but we saved the history. Job done.
        return { sent: false, reason: "No devices" };
      }

      // C. Send via FCM
      if (fcm) {
        const response = await fcm.sendEachForMulticast({
          tokens,
          notification: { title, body },
          data: { ...data, notificationId: notification.id }, // Attach ID
        });

        logger.debug(
          `[NotificationQueue] Sent to ${response.successCount}/${tokens.length} devices for user ${userId}`
        );
        return { sent: true, successCount: response.successCount };
      } else {
        logger.info(`[NotificationQueue] [MOCK] To ${userId}: ${title}`);
        return { sent: true, type: "MOCK" };
      }
    } catch (error: any) {
      logger.error(`[NotificationQueue] Job ${job.id} failed:`, error);
      throw error; // Triggers retry
    }
  },
  {
    connection: {
      host: env.REDIS_HOST,
      port: env.REDIS_PORT,
    },
    concurrency: 20, // Process 20 notifications in parallel
  }
);

// Worker Lifecycle Logs
notificationWorker.on("failed", (job, err) => {
  logger.error(
    `[NotificationQueue] Job ${job?.id} failed permanently: ${err.message}`
  );
});

logger.info("[NotificationQueue] Worker initialized");
