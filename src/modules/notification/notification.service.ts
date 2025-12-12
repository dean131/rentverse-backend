import notificationRepository from "./notification.repository.js";
import { fcm } from "../../config/firebase.js";
import logger from "../../config/logger.js";
import { RegisterDeviceInput } from "./notification.schema.js";
import prisma from "../../config/prisma.js"; // Import Prisma

class NotificationService {
  async registerDevice(userId: string, input: RegisterDeviceInput) {
    await notificationRepository.upsertUserDevice(userId, input);
    logger.info(`[Notification] Device registered for user ${userId}`);
    return { message: "Device registered successfully" };
  }

  /**
   * Send a Push Notification AND Save to Database
   */
  async sendToUser(
    userId: string,
    title: string,
    body: string,
    data?: Record<string, string>
  ) {
    // 1. Persist to Database
    // We try/catch this to ensure DB failure doesn't block the push (or vice versa depending on priority)
    try {
      await prisma.notification.create({
        data: {
          userId,
          title,
          body,
          type: data?.type || "SYSTEM",
          data: data || {},
        },
      });
    } catch (dbError) {
      logger.error(
        `[Notification] Failed to save history for ${userId}`,
        dbError
      );
    }

    // 2. Get Tokens & Send via FCM
    const tokens = await notificationRepository.findTokensByUserId(userId);

    if (tokens.length === 0) {
      logger.debug(
        `[Notification] No devices found for user ${userId}. Skipping Push.`
      );
      return;
    }

    if (fcm) {
      try {
        const response = await fcm.sendEachForMulticast({
          tokens,
          notification: { title, body },
          data,
        });
        logger.info(`[Notification] Sent to ${response.successCount} devices`);
      } catch (error) {
        logger.error(`[Notification] FCM Error:`, error);
      }
    } else {
      logger.info(`[Notification] [MOCK] To ${userId}: ${title}`);
    }
  }

  /**
   * Get History
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
      where: { id: notificationId, userId }, // Security check
      data: { isRead: true },
    });
  }
}

export default new NotificationService();
