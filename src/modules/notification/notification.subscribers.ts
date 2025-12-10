import eventBus from "../../shared/bus/event-bus.js";
import notificationService from "./notification.service.js";
import prisma from "../../config/prisma.js";
import logger from "../../config/logger.js";

export const registerNotificationSubscribers = () => {
  logger.info("[Notification] Subscribers Registered");

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
  // 2. CHAT MESSAGE NOTIFICATION
  // ---------------------------------------------------------
  eventBus.subscribe("CHAT:MESSAGE_SENT", async (payload: any) => {
    try {
      const room = await prisma.chatRoom.findUnique({
        where: { id: payload.roomId },
        select: { tenantId: true, landlordId: true },
      });

      if (!room) return;

      const receiverId =
        payload.senderId === room.tenantId ? room.landlordId : room.tenantId;

      const sender = await prisma.user.findUnique({
        where: { id: payload.senderId },
        select: { name: true },
      });
      const senderName = sender?.name || "Someone";

      await notificationService.sendToUser(
        receiverId,
        `New message from ${senderName}`, // Title
        payload.content, // Body
        {
          // Data (Optional 4th arg)
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
  // 3. BOOKING CREATED
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

  // Booking Confirmed -> Notify Tenant
  eventBus.subscribe("BOOKING:CONFIRMED", async (payload) => {
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

  // Booking Rejected -> Notify Tenant
  eventBus.subscribe("BOOKING:REJECTED", async (payload) => {
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
};
