import eventBus from "../../shared/bus/event-bus.js";
import trustService from "./trust.service.js";
import logger from "config/logger.js";
import trustRepository from "./trust.repository.js";

/**
 * Register all Event Listeners for the Trust Module.
 */
export const registerTrustSubscribers = () => {
  // 1. Auth Listener
  eventBus.subscribe("AUTH:USER_REGISTERED", async (payload) => {
    await trustService.initializeTrustScore(payload.userId, payload.role);
  });

  // 2. [NEW] Payment Listener -> Reward Tenant
  eventBus.subscribe("PAYMENT:PAID", async (payload) => {
    logger.info(`[Trust] Rewarding tenant ${payload.tenantId} for payment.`);

    await trustRepository.createLogAndUpdateScore(payload.tenantId, "TENANT", {
      eventCode: "PAYMENT_ON_TIME",
      impact: 2.0, // +2 Points
      description: `Rent payment successful for invoice ${payload.invoiceId}`,
      actor: "SYSTEM",
      sourceType: "AUTOMATED",
    });
  });
};
