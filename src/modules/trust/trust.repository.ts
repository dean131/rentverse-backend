import { Prisma } from "@prisma/client";
import prisma from "../../config/prisma.js";

class TrustRepository {
  /**
   * Helper: Get the DB client (either the transaction scope or the main instance)
   */
  private getClient(tx?: Prisma.TransactionClient) {
    return tx || prisma;
  }

  // =================================================================
  // READ OPERATIONS
  // =================================================================

  async findEventRule(code: string) {
    // Rules are config; typically read from main replica (no lock needed)
    return await prisma.trustEvent.findUnique({ where: { code } });
  }

  async getTenantProfile(userId: string, tx?: Prisma.TransactionClient) {
    return await this.getClient(tx).tenantTrustProfile.findUniqueOrThrow({
      where: { userRefId: userId },
    });
  }

  async getLandlordProfile(userId: string, tx?: Prisma.TransactionClient) {
    return await this.getClient(tx).landlordTrustProfile.findUniqueOrThrow({
      where: { userRefId: userId },
    });
  }

  // =================================================================
  // WRITE OPERATIONS
  // =================================================================

  async createTenantProfile(userId: string, tx?: Prisma.TransactionClient) {
    return await this.getClient(tx).tenantTrustProfile.create({
      data: { userRefId: userId, tti_score: 50.0 }, // Start Neutral
    });
  }

  async createLandlordProfile(userId: string, tx?: Prisma.TransactionClient) {
    return await this.getClient(tx).landlordTrustProfile.create({
      data: { userRefId: userId, lrs_score: 50.0 }, // Start Neutral
    });
  }

  async updateTenantScore(userId: string, newScore: number, tx?: Prisma.TransactionClient) {
    return await this.getClient(tx).tenantTrustProfile.update({
      where: { userRefId: userId },
      data: { tti_score: newScore },
    });
  }

  async updateLandlordScore(userId: string, newScore: number, tx?: Prisma.TransactionClient) {
    return await this.getClient(tx).landlordTrustProfile.update({
      where: { userRefId: userId },
      data: { lrs_score: newScore },
    });
  }

  async createLog(data: Prisma.TrustLogCreateInput, tx?: Prisma.TransactionClient) {
    return await this.getClient(tx).trustLog.create({
      data,
    });
  }
}

export default new TrustRepository();