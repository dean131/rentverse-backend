import eventBus from "../../shared/bus/event-bus.js";
import trustService from "./trust.service.js";

/**
 * Register all Event Listeners for the Trust Module.
 */
export const registerTrustSubscribers = () => {
  // LISTENER: When a new user is registered in Auth...
  eventBus.subscribe("AUTH:USER_REGISTERED", async (payload) => {
    // ...The Trust module creates their initial scorecard.
    await trustService.initializeTrustScore(payload.userId, payload.role);
  });
};
