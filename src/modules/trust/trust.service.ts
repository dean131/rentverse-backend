import trustRepository from "./trust.repository.js";
import prisma from "../../config/prisma.js"; // Service orchestrates the transaction
import logger from "../../config/logger.js";

class TrustService {
  /**
   * Initialize Profile on User Registration
   */
  async initializeProfile(userId: string, role: string) {
    if (role === "TENANT") {
      return await trustRepository.createTenantProfile(userId);
    } else {
      return await trustRepository.createLandlordProfile(userId);
    }
  }

  /**
   * Apply an Automated System Reward/Penalty
   * Wraps the logic in a Database Transaction.
   */
  async applySystemReward(
    userId: string,
    role: "TENANT" | "LANDLORD",
    eventCode: string,
    context: {
      description?: string;
      referenceId?: string;
      referenceType?: string;
    }
  ) {
    // 1. Validation (Outside Transaction)
    const rule = await trustRepository.findEventRule(eventCode);

    if (!rule) {
      logger.warn(`[Trust] Rule '${eventCode}' not found. Action skipped.`);
      return null;
    }
    if (!rule.isActive) {
      logger.info(`[Trust] Rule '${eventCode}' is disabled. Action skipped.`);
      return null;
    }

    // 2. Transaction Execution
    try {
      const newScore = await prisma.$transaction(async (tx) => {
        let currentScore = 0;
        let newCalculatedScore = 0;
        let profileId = "";

        // A. Read Profile & Calculate Score
        if (role === "TENANT") {
          const profile = await trustRepository.getTenantProfile(userId, tx);
          
          // Logic: Clamp score between 0 and 100
          newCalculatedScore = Math.max(0, Math.min(100, profile.tti_score + rule.baseImpact));
          profileId = profile.id;
          
          await trustRepository.updateTenantScore(userId, newCalculatedScore, tx);
        } else {
          const profile = await trustRepository.getLandlordProfile(userId, tx);
          
          newCalculatedScore = Math.max(0, Math.min(100, profile.lrs_score + rule.baseImpact));
          profileId = profile.id;
          
          await trustRepository.updateLandlordScore(userId, newCalculatedScore, tx);
        }

        // B. Create Audit Log
        const finalDescription = context.description || rule.description || "System update";
        
        await trustRepository.createLog({
          eventCode: rule.code,
          impact: rule.baseImpact,
          scoreSnapshot: newCalculatedScore,
          description: finalDescription,
          actor: "SYSTEM",
          sourceType: "AUTOMATED",
          referenceId: context.referenceId,
          referenceType: context.referenceType,
          // Link dynamically based on role
          tenant: role === "TENANT" ? { connect: { id: profileId } } : undefined,
          landlord: role === "LANDLORD" ? { connect: { id: profileId } } : undefined,
        }, tx);

        return newCalculatedScore;
      });

      logger.info(`[Trust] Applied ${eventCode} to ${role}. New Score: ${newScore}`);
      return newScore;

    } catch (error) {
      logger.error(`[Trust] Transaction failed for ${eventCode}:`, error);
      throw error; // Re-throw to ensure caller knows it failed
    }
  }
}

export default new TrustService();