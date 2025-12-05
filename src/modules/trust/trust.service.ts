import trustRepository from "./trust.repository.js";
import logger from "../../config/logger.js";

class TrustService {
  /**
   * Called when a new user registers.
   * Logs the initial "Account Created" event (Neutral Impact).
   */
  async initializeTrustScore(userId: string, role: 'TENANT' | 'LANDLORD') {
    logger.info(`[TrustService] Initializing score for user ${userId}`);

    await trustRepository.createLogAndUpdateScore(userId, role, {
      eventCode: "ACCOUNT_CREATED",
      impact: 0, // No points for just signing up
      description: "User account created successfully",
      actor: "SYSTEM",
      sourceType: "AUTOMATED"
    });
  }
}

export default new TrustService();