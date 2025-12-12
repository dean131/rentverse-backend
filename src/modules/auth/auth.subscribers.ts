import eventBus from "../../shared/bus/event-bus.js";
import authRepository from "./auth.repository.js";
import logger from "../../config/logger.js";

export const registerAuthSubscribers = () => {
  
  // Trigger: Admin approves KYC
  eventBus.subscribe("KYC:VERIFIED", async (payload: any) => {
    logger.info(`[Auth] Listener caught KYC:VERIFIED for ${payload.userId}. Re-evaluating status...`);
    
    // The "Brain" decides if they are fully verified now
    await authRepository.refreshUserVerification(payload.userId);
  });

  // You can also listen for KYC:REJECTED to demote them if needed
  eventBus.subscribe("KYC:REJECTED", async (payload: any) => {
    await authRepository.refreshUserVerification(payload.userId);
  });
};