import notificationRepository from "./notification.repository.js";
import { RegisterDeviceInput } from "./notification.schema.js";
import prisma from "../../config/prisma.js";
import logger from "../../config/logger.js";
import { notificationQueue } from "./notification.queue.js"; // [NEW] Import Queue

class NotificationService {
  /**
   * Register a device for push notifications
   */
  async registerDevice(userId: string, input: RegisterDeviceInput) {
    await notificationRepository.upsertUserDevice(userId, input);
    logger.info(`[Notification] Device registered for user ${userId}`);
    return { message: "Device registered successfully" };
  }

  /**
   * Send a Push Notification (Queued)
   * This is now non-blocking and extremely fast.
   */
  async sendToUser(
    userId: string,
    title: string,
    body: string,
    data?: Record<string, string>
  ) {
    // Add job to Redis Queue
    await notificationQueue.add("sendPush", {
      userId,
      title,
      body,
      data,
    });

    // We don't wait for the result. We trust the queue.
    logger.debug(`[Notification] Queued alert for ${userId}`);
  }

  /**
   * Get User's Notification History
   */
  async getUserNotifications(userId: string, limit = 20, cursor?: string) {
    const cursorObj = cursor ? { id: cursor } : undefined;
    const skip = cursor ? 1 : 0;

    return await prisma.notification.findMany({
      where: { userId },
      take: limit,
      skip,
      cursor: cursorObj,
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Mark as Read
   */
  async markAsRead(userId: string, notificationId: string) {
    await prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { isRead: true },
    });
  }
}

export default new NotificationService();
