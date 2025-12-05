import prisma from "../../config/prisma.js";

class NotificationRepository {
  /**
   * Upsert User Device (FCM Token).
   * Ensures a token is only stored once, updating its owner if needed.
   */
  async upsertUserDevice(userId: string, data: { fcmToken: string; platform: string; deviceModel?: string }) {
    return await prisma.userDevice.upsert({
      where: { fcmToken: data.fcmToken },
      update: {
        userId,
        lastActiveAt: new Date(),
        deviceModel: data.deviceModel,
      },
      create: {
        userId,
        fcmToken: data.fcmToken,
        platform: data.platform,
        deviceModel: data.deviceModel,
      },
    });
  }

  /**
   * Find all device tokens for a specific user
   */
  async findTokensByUserId(userId: string) {
    const devices = await prisma.userDevice.findMany({
      where: { userId },
      select: { fcmToken: true },
    });
    return devices.map((d) => d.fcmToken);
  }
}

export default new NotificationRepository();