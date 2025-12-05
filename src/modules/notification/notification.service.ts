import notificationRepository from "./notification.repository.js";
import { fcm } from "../../config/firebase.js"; // Ensure you created this config file from the previous step
import logger from "../../config/logger.js";
import { RegisterDeviceInput } from "./notification.schema.js";

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
   * Send a Push Notification to a specific user.
   */
  async sendToUser(userId: string, title: string, body: string, data?: Record<string, string>) {
    // 1. Get Tokens
    const tokens = await notificationRepository.findTokensByUserId(userId);

    if (tokens.length === 0) {
      logger.debug(`[Notification] No devices found for user ${userId}. Skipping.`);
      return;
    }

    // 2. Send via FCM (if configured)
    if (fcm) {
      try {
        const response = await fcm.sendEachForMulticast({
          tokens,
          notification: { title, body },
          data,
        });

        logger.info(`[Notification] Sent to ${response.successCount} devices for user ${userId}`);
      } catch (error) {
        logger.error(`[Notification] FCM Error:`, error);
      }
    } else {
      // Mock Mode
      logger.info(`[Notification] [MOCK SEND] To User ${userId}: "${title}" - "${body}"`);
    }
  }
}

export default new NotificationService();