import trustRepository from "./trust.repository.js";
import prisma from "../../config/prisma.js";
import logger from "../../config/logger.js";

class TrustService {

  /**
   * 1. Automated System Reward
   * Applies a pre-defined rule from the database (e.g., "PAYMENT_ON_TIME" = +2.0).
   */
  async applySystemReward(
    userId: string,
    role: string,
    eventCode: string,
    context: {
      description?: string;
      referenceId?: string;
      referenceType?: string;
    }
  ) {
    // A. Validation (Read-only, outside transaction)
    const rule = await trustRepository.findEventRule(eventCode);

    if (!rule) {
      logger.warn(`[Trust] Rule '${eventCode}' not found. Action skipped.`);
      return null;
    }
    if (!rule.isActive) {
      logger.info(`[Trust] Rule '${eventCode}' is disabled. Action skipped.`);
      return null;
    }

    // B. Execution (Transaction)
    try {
      return await prisma.$transaction(async (tx) => {
        let currentScore = 0;
        let profileId = "";

        // 1. Get Current Profile
        if (role === "TENANT") {
          const profile = await trustRepository.getTenantProfile(userId, tx);
          profileId = profile.id;
          currentScore = profile.tti_score;
        } else {
          const profile = await trustRepository.getLandlordProfile(userId, tx);
          profileId = profile.id;
          currentScore = profile.lrs_score;
        }

        // 2. Calculate New Score (Clamped 0 - 100)
        const newScore = Math.max(0, Math.min(100, currentScore + rule.baseImpact));

        // 3. Update Database
        if (role === "TENANT") {
          await trustRepository.updateTenantScore(userId, newScore, tx);
        } else {
          await trustRepository.updateLandlordScore(userId, newScore, tx);
        }

        // 4. Create Audit Log
        await trustRepository.createLog({
          eventCode: rule.code,
          impact: rule.baseImpact,
          scoreSnapshot: newScore,
          description: context.description || rule.description || "System update",
          actor: "SYSTEM",
          sourceType: "AUTOMATED",
          referenceId: context.referenceId,
          referenceType: context.referenceType,
          tenant: role === "TENANT" ? { connect: { id: profileId } } : undefined,
          landlord: role === "LANDLORD" ? { connect: { id: profileId } } : undefined,
        }, tx);

        logger.info(`[Trust] Applied ${eventCode} to ${role}. New Score: ${newScore}`);
        return newScore;
      });
    } catch (error) {
      logger.error(`[Trust] Transaction failed for ${eventCode}:`, error);
      throw error;
    }
  }

  /**
   * 2. Manual Admin Adjustment (Governance)
   * Applies an arbitrary delta provided by an Admin (e.g., -15 or +5).
   */
  async applyManualAdjustment(
    adminId: string,
    userId: string,
    role: "TENANT" | "LANDLORD",
    delta: number,
    reason: string
  ) {
    try {
      return await prisma.$transaction(async (tx) => {
        let currentScore = 0;
        let profileId = "";

        // 1. Get Current Profile
        if (role === "TENANT") {
          const profile = await trustRepository.getTenantProfile(userId, tx);
          profileId = profile.id;
          currentScore = profile.tti_score;
        } else {
          const profile = await trustRepository.getLandlordProfile(userId, tx);
          profileId = profile.id;
          currentScore = profile.lrs_score;
        }

        // 2. Calculate New Score (Clamped 0 - 100)
        const newScore = Math.max(0, Math.min(100, currentScore + delta));

        // 3. Update Database
        if (role === "TENANT") {
          await trustRepository.updateTenantScore(userId, newScore, tx);
        } else {
          await trustRepository.updateLandlordScore(userId, newScore, tx);
        }

        // 4. Create Audit Log (Source = MANUAL)
        await trustRepository.createLog({
          eventCode: "ADMIN_ADJUSTMENT",
          impact: delta,
          scoreSnapshot: newScore,
          description: reason,
          actor: "ADMIN",
          referenceId: adminId,
          referenceType: "ADMIN_USER",
          sourceType: "MANUAL",
          tenant: role === "TENANT" ? { connect: { id: profileId } } : undefined,
          landlord: role === "LANDLORD" ? { connect: { id: profileId } } : undefined,
        }, tx);

        logger.info(`[Trust] Admin ${adminId} adjusted ${role} ${userId} by ${delta}. New Score: ${newScore}`);
        return newScore;
      });
    } catch (error) {
      logger.error(`[Trust] Manual adjustment failed:`, error);
      throw error;
    }
  }
}

export default new TrustService();