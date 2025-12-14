import eventBus from "../../shared/bus/event-bus.js";
import trustService from "./trust.service.js";
import prisma from "../../config/prisma.js";
import logger from "../../config/logger.js";

export const registerTrustSubscribers = () => {
  logger.info("[Trust] Subscribers Registered");

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
      const room = await prisma.chatRoom.findUnique({
        where: { id: payload.roomId },
      });
      if (!room || room.landlordId !== payload.senderId) return; // Only reward landlords

      const lastMessages = await prisma.chatMessage.findMany({
        where: { roomId: payload.roomId },
        orderBy: { createdAt: "desc" },
        take: 2,
      });

      if (lastMessages.length < 2) return;
      if (lastMessages[1].senderId !== room.tenantId) return; // Ensure replying to tenant

      const diffMinutes = Math.floor(
        (lastMessages[0].createdAt.getTime() -
          lastMessages[1].createdAt.getTime()) /
          60000
      );

      if (diffMinutes <= 30) {
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

  // 4. KYC Verification Bonus (Tenant/Landlord)
  eventBus.subscribe("KYC:VERIFIED", async (payload: any) => {
    logger.info(`[Trust] Processing KYC Reward for ${payload.userId}`);
    await trustService.applySystemReward(
      payload.userId,
      payload.role, // "TENANT" or "LANDLORD"
      "KYC_VERIFIED",
      {
        description: "Identity verified by Admin",
        referenceId: payload.adminId,
        referenceType: "ADMIN_ACTION",
      }
    );
  });

  // 5. Admin Manual Adjustment (Governance)
  eventBus.subscribe("ADMIN:TRUST_SCORE_ADJUSTED", async (payload: any) => {
    logger.info(`[Trust] Processing Admin Override for ${payload.userId}`);
    await trustService.applyManualAdjustment(
      payload.adminId,
      payload.userId,
      payload.role,
      payload.scoreDelta,
      payload.reason
    );
  });

  // 6. Review Impact
  eventBus.subscribe("REVIEW:CREATED", async (payload: any) => {
    // Objectivity Check
    // If a TENANT wrote the review, it is a PROPERTY review.
    // We DO NOT update the Landlord's LRS here.
    if (payload.role === "TENANT") {
      logger.info(
        `[Trust] Review ${payload.reviewId} is for a Property. Skipping LRS update.`
      );
      return;
    }

    // If a LANDLORD wrote the review, it is a BEHAVIOR review.
    // We CONTINUE to update the Tenant's TTI.
    logger.info(
      `[Trust] Processing Tenant Behavior Rating: ${payload.rating} stars`
    );

    let impact = 0;
    // ... (Calculate impact based on stars: 5=+3, 1=-5, etc.) ...
    switch (payload.rating) {
      case 5:
        impact = 3.0;
        break;
      case 4:
        impact = 1.0;
        break;
      case 3:
        impact = 0.0;
        break;
      case 2:
        impact = -3.0;
        break;
      case 1:
        impact = -5.0;
        break;
    }

    await trustService.applyManualAdjustment(
      "SYSTEM",
      payload.receiverId,
      "TENANT", // Target is always Tenant in this block
      impact,
      `Received ${payload.rating}-star review from Landlord`
    );
  });
};
