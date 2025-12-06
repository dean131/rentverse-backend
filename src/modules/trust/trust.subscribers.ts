import eventBus from "../../shared/bus/event-bus.js";
import trustService from "./trust.service.js";
import logger from "config/logger.js";
import trustRepository from "./trust.repository.js";

/**
 * Register all Event Listeners for the Trust Module.
 */
export const registerTrustSubscribers = () => {
  // LISTENER: When a new user is registered in Auth...
  eventBus.subscribe("AUTH:USER_REGISTERED", async (payload) => {
    // ...The Trust module creates their initial scorecard.
    await trustService.initializeTrustScore(payload.userId, payload.role);
  });

  // 2. Payment Success -> Boost Score
  eventBus.subscribe("PAYMENT:PAID", async (payload) => {
    logger.info(`[Trust] Processing payment reward for tenant ${payload.tenantId}`);
    
    // Logic: +2 Points for on-time payment
    // In a real app, check if paidAt <= dueDate to decide if it's "On Time" or "Late"
    await trustRepository.createLogAndUpdateScore(
      payload.tenantId,
      'TENANT',
      {
        eventCode: "PAYMENT_ON_TIME",
        impact: 2.0,
        description: `Rent payment successful for invoice ${payload.invoiceId}`,
        actor: "SYSTEM",
        sourceType: "AUTOMATED"
      }
    );
  });
};
