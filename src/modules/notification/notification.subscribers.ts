import eventBus from "../../shared/bus/event-bus.js";
import notificationService from "./notification.service.js";

export const registerNotificationSubscribers = () => {
  
  // 1. Welcome Message
  eventBus.subscribe("AUTH:USER_REGISTERED", async (payload) => {
    await notificationService.sendToUser(
      payload.userId,
      "Welcome to Rentverse! 🏠",
      "Your account is ready. Complete your profile to start your journey."
    );
  });

  // 2. Trust Score Updates (Future)
  // eventBus.subscribe("TRUST:SCORE_CHANGED", ...);
};