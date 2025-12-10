import eventBus from "../../shared/bus/event-bus.js";
import trustService from "./trust.service.js";
import prisma from "../../config/prisma.js";
import logger from "../../config/logger.js";

export const registerTrustSubscribers = () => {
  logger.info("[Trust] Subscribers Registered");

  // 1. Init Profile
  eventBus.subscribe("AUTH:USER_REGISTERED", async (payload: any) => {
    await trustService.initializeProfile(payload.userId, payload.role);
  });

  // 2. Payment Reward (Tenant)
  eventBus.subscribe("PAYMENT:PAID", async (payload: any) => {
    await trustService.applySystemReward(
      payload.tenantId,
      "TENANT",
      "PAYMENT_ON_TIME",
      {
        referenceId: payload.invoiceId,
        referenceType: "INVOICE",
        description: "Paid invoice on time",
      }
    );
  });

  // 3. Chat Response Reward (Landlord)
  eventBus.subscribe("CHAT:MESSAGE_SENT", async (payload: any) => {
    try {
      // Gather Data (Read-Only) to decide if we should call the service
      const room = await prisma.chatRoom.findUnique({
        where: { id: payload.roomId },
      });
      if (!room || room.landlordId !== payload.senderId) return;

      const lastMessages = await prisma.chatMessage.findMany({
        where: { roomId: payload.roomId },
        orderBy: { createdAt: "desc" },
        take: 2,
      });

      if (lastMessages.length < 2) return;
      if (lastMessages[1].senderId !== room.tenantId) return;

      // Calculate Logic
      const diffMinutes = Math.floor(
        (lastMessages[0].createdAt.getTime() -
          lastMessages[1].createdAt.getTime()) /
          60000
      );

      if (diffMinutes <= 30) {
        // Execute Reward
        await trustService.applySystemReward(
          payload.senderId,
          "LANDLORD",
          "COMM_FAST_RESPONSE",
          {
            referenceId: payload.roomId,
            referenceType: "CHAT_ROOM",
            description: `Responded in ${diffMinutes} mins`,
          }
        );
      }
    } catch (error) {
      logger.error("[Trust] Chat event processing error:", error);
    }
  });

  //  Handle KYC Verification Reward
  eventBus.subscribe("KYC:VERIFIED", async (payload: any) => {
    logger.info(`[Trust] Processing KYC Reward for ${payload.userId}`);

    await trustService.applySystemReward(
      payload.userId,
      payload.role,
      "KYC_VERIFIED", // Ensure this rule exists in DB
      {
        description: "Identity verified by Admin",
        referenceId: payload.adminId,
        referenceType: "ADMIN_ACTION",
      }
    );
  });
};
