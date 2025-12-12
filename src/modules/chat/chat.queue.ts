import { Queue, Worker, Job } from "bullmq";
import { env } from "../../config/env.js";
import prisma from "../../config/prisma.js";
import logger from "../../config/logger.js";
import eventBus from "../../shared/bus/event-bus.js";

/**
 * Payload structure for the Chat Job
 */
interface ChatJobData {
  roomId: string;
  senderId: string;
  receiverId: string;
  content: string;
  tempId?: string;
}

/**
 * 1. The Chat Queue (Producer)
 * Used by SocketService to offload message processing.
 */
export const chatQueue = new Queue("ChatQueue", {
  connection: {
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
  },
  defaultJobOptions: {
    attempts: 3, // Retry 3 times on DB failure
    backoff: {
      type: "exponential",
      delay: 1000,
    },
    removeOnComplete: true, // Auto-cleanup to save Redis memory
    removeOnFail: 100, // Keep last 100 failed jobs for debugging
  },
});

/**
 * 2. The Chat Worker (Consumer)
 * Processes messages asynchronously to prevent database locks during traffic spikes.
 */
const chatWorker = new Worker<ChatJobData>(
  "ChatQueue",
  async (job: Job<ChatJobData>) => {
    const { roomId, senderId, receiverId, content, tempId } = job.data;

    try {
      // A. Transaction: Save Message & Update Room Activity
      // We use a transaction to ensure data integrity.
      const [message] = await prisma.$transaction([
        prisma.chatMessage.create({
          data: {
            roomId,
            senderId,
            content,
            isRead: false,
          },
        }),
        prisma.chatRoom.update({
          where: { id: roomId },
          data: { lastMessageAt: new Date() },
        }),
      ]);

      // B. Publish Internal Event
      // This signals the SocketService to broadcast the saved message.
      eventBus.publish("CHAT:MESSAGE_PROCESSED", {
        message: message as any,
        roomId,
        senderId,
        receiverId,
        tempId,
      });

      return message;
    } catch (error: any) {
      logger.error(`[ChatQueue] Job ${job.id} failed: ${error.message}`);
      throw error; // Triggers BullMQ retry logic
    }
  },
  {
    connection: {
      host: env.REDIS_HOST,
      port: env.REDIS_PORT,
    },
    concurrency: 50, // Process up to 50 messages in parallel
  }
);

// Worker Event Listeners for Observability
chatWorker.on("error", (err) => {
  logger.error("[ChatQueue] Worker Error:", err);
});

chatWorker.on("failed", (job, err) => {
  logger.error(`[ChatQueue] Job ${job?.id} permanently failed: ${err.message}`);
});

logger.info("[ChatQueue] Worker initialized and listening");