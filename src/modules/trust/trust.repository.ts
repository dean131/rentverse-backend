import { Prisma } from "@prisma/client";
import prisma from "../../config/prisma.js";

class TrustRepository {
  /**
   * Create an initial Trust Log entry (e.g. "Welcome Bonus").
   * Updates the score and writes the log in a transaction.
   */
  async createLogAndUpdateScore(
    userId: string,
    role: 'TENANT' | 'LANDLORD',
    logData: {
      eventCode: string;
      impact: number;
      description: string;
      actor: string;
      sourceType: string;
    }
  ) {
    return await prisma.$transaction(async (tx) => {
      // 1. Determine which profile to update
      let currentScore = 50.0;
      
      if (role === 'TENANT') {
        const profile = await tx.tenantTrustProfile.findUniqueOrThrow({ where: { userRefId: userId } });
        currentScore = profile.tti_score + logData.impact;
        
        // Update Tenant Score
        await tx.tenantTrustProfile.update({
          where: { userRefId: userId },
          data: { tti_score: currentScore },
        });

      } else {
        const profile = await tx.landlordTrustProfile.findUniqueOrThrow({ where: { userRefId: userId } });
        currentScore = profile.lrs_score + logData.impact;

        // Update Landlord Score
        await tx.landlordTrustProfile.update({
          where: { userRefId: userId },
          data: { lrs_score: currentScore },
        });
      }

      // 2. Create the Trust Log
      await tx.trustLog.create({
        data: {
          eventCode: logData.eventCode,
          impact: logData.impact,
          scoreSnapshot: currentScore,
          description: logData.description,
          actor: logData.actor,
          // Link to the correct profile
          tenant: role === 'TENANT' ? { connect: { userRefId: userId } } : undefined,
          landlord: role === 'LANDLORD' ? { connect: { userRefId: userId } } : undefined,
        },
      });

      return currentScore;
    });
  }
}

export default new TrustRepository();