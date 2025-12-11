import eventBus from "../../shared/bus/event-bus.js";
import notificationService from "./notification.service.js";
import prisma from "../../config/prisma.js";
import logger from "../../config/logger.js";

export const registerNotificationSubscribers = () => {
  logger.info("[Notification] Notification Subscribers Registered");

  // ---------------------------------------------------------
  // 1. WELCOME NOTIFICATION
  // ---------------------------------------------------------
  eventBus.subscribe("AUTH:USER_REGISTERED", async (payload: any) => {
    try {
      await notificationService.sendToUser(
        payload.userId,
        "Welcome to Rentverse! 🏠",
        "Your account has been successfully created. Start exploring properties now!",
        {
          type: "WELCOME",
          click_action: "FLUTTER_NOTIFICATION_CLICK",
        }
      );
      logger.debug(`[Notification] Welcome sent to ${payload.userId}`);
    } catch (error) {
      logger.error("[Notification] Failed to send welcome:", error);
    }
  });

  // ---------------------------------------------------------
  // 2. CHAT MESSAGE NOTIFICATION (Completed)
  // ---------------------------------------------------------
  eventBus.subscribe("CHAT:MESSAGE_SENT", async (payload: any) => {
    try {
      // 1. Find the Room to identify the receiver
      const room = await prisma.chatRoom.findUnique({
        where: { id: payload.roomId },
        select: { tenantId: true, landlordId: true },
      });

      if (!room) {
        logger.warn(
          `[Notification] Chat room ${payload.roomId} not found. Skipping push.`
        );
        return;
      }

      // Determine Receiver: If sender is Tenant, receiver is Landlord (and vice versa)
      const receiverId =
        payload.senderId === room.tenantId ? room.landlordId : room.tenantId;

      // 2. Get Sender Name for the notification title
      const sender = await prisma.user.findUnique({
        where: { id: payload.senderId },
        select: { name: true },
      });
      const senderName = sender?.name || "Someone";

      // 3. Send Notification
      await notificationService.sendToUser(
        receiverId,
        `New message from ${senderName}`,
        payload.content,
        {
          type: "CHAT_MESSAGE",
          roomId: payload.roomId,
          senderId: payload.senderId,
          click_action: "FLUTTER_NOTIFICATION_CLICK",
        }
      );

      logger.debug(`[Notification] Chat push sent to ${receiverId}`);
    } catch (error) {
      logger.error("[Notification] Failed to process chat event:", error);
    }
  });

  // ---------------------------------------------------------
  // 3. BOOKING CREATED (Notify Landlord)
  // ---------------------------------------------------------
  eventBus.subscribe("BOOKING:CREATED", async (payload: any) => {
    try {
      await notificationService.sendToUser(
        payload.landlordId,
        "New Booking Request! 📅",
        `You have a new booking request for ${payload.propertyTitle}. Check it now!`,
        {
          type: "BOOKING_REQUEST",
          bookingId: payload.bookingId,
          click_action: "FLUTTER_NOTIFICATION_CLICK",
        }
      );
      logger.debug(
        `[Notification] Booking alert sent to landlord ${payload.landlordId}`
      );
    } catch (error) {
      logger.error("[Notification] Failed to process booking event:", error);
    }
  });

  // ---------------------------------------------------------
  // 4. BOOKING CONFIRMED (Notify Tenant)
  // ---------------------------------------------------------
  eventBus.subscribe("BOOKING:CONFIRMED", async (payload: any) => {
    try {
      await notificationService.sendToUser(
        payload.tenantId,
        "Booking Confirmed! 🎉",
        `Your booking for ${payload.propertyTitle} has been accepted. Get ready to move in!`,
        {
          type: "BOOKING_STATUS",
          bookingId: payload.bookingId,
          status: "CONFIRMED",
          click_action: "FLUTTER_NOTIFICATION_CLICK",
        }
      );
      logger.debug(
        `[Notification] Booking Confirm sent to ${payload.tenantId}`
      );
    } catch (error) {
      logger.error(
        "[Notification] Failed to send booking confirmation:",
        error
      );
    }
  });

  // ---------------------------------------------------------
  // 5. BOOKING REJECTED (Notify Tenant)
  // ---------------------------------------------------------
  eventBus.subscribe("BOOKING:REJECTED", async (payload: any) => {
    try {
      await notificationService.sendToUser(
        payload.tenantId,
        "Booking Update 😔",
        `Your request for ${payload.propertyTitle} was declined. Reason: ${payload.reason}`,
        {
          type: "BOOKING_STATUS",
          bookingId: payload.bookingId,
          status: "REJECTED",
          click_action: "FLUTTER_NOTIFICATION_CLICK",
        }
      );
      logger.debug(`[Notification] Booking Reject sent to ${payload.tenantId}`);
    } catch (error) {
      logger.error("[Notification] Failed to send booking rejection:", error);
    }
  });

  // 6. [NEW] Property Approved
  eventBus.subscribe("PROPERTY:VERIFIED", async (payload: any) => {
    await notificationService.sendToUser(
      payload.landlordId,
      "Property Live! 🏠",
      `Your listing "${payload.title}" has been approved and is now visible to tenants.`,
      { type: "PROPERTY", propertyId: payload.propertyId }
    );
  });

  // 7. [NEW] Property Rejected
  eventBus.subscribe("PROPERTY:REJECTED", async (payload: any) => {
    await notificationService.sendToUser(
      payload.landlordId,
      "Listing Rejected 🛑",
      `Your listing "${payload.title}" was rejected. Reason: ${payload.reason}`,
      { type: "PROPERTY", propertyId: payload.propertyId }
    );
  });
};
