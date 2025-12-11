import { Prisma } from "@prisma/client";
import prisma from "../../config/prisma.js";

class AdminRepository {
  /**
   * Fetch paginated users with filters.
   */
  async findAllUsers(
    skip: number,
    take: number,
    filters: {
      search?: string;
      role?: "TENANT" | "LANDLORD" | "ALL";
      kycStatus?: string;
    }
  ) {
    const where: Prisma.UserWhereInput = {
      deletedAt: null,
    };

    // Filter by Role
    if (filters.role && filters.role !== "ALL") {
      where.roles = { some: { role: { name: filters.role } } };
    }

    // Search (Name, Email, Phone)
    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: "insensitive" } },
        { email: { contains: filters.search, mode: "insensitive" } },
        { phone: { contains: filters.search } },
      ];
    }

    // Filter by KYC Status
    if (filters.kycStatus) {
      if (filters.role === "TENANT") {
        where.tenantProfile = { kyc_status: filters.kycStatus };
      } else if (filters.role === "LANDLORD") {
        where.landlordProfile = { kyc_status: filters.kycStatus };
      } else {
        where.OR = [
          { tenantProfile: { kyc_status: filters.kycStatus } },
          { landlordProfile: { kyc_status: filters.kycStatus } },
        ];
      }
    }

    // Execute Transaction
    const [total, users] = await prisma.$transaction([
      prisma.user.count({ where }), // Count ALL
      prisma.user.findMany({
        // Fetch Page
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        include: {
          roles: { include: { role: true } },
          tenantProfile: { select: { tti_score: true, kyc_status: true } },
          landlordProfile: { select: { lrs_score: true, kyc_status: true } },
        },
      }),
    ]);

    return { total, users };
  }

  /**
   * Find User Details (with Profiles and Wallet)
   */
  async findUserById(userId: string) {
    return await prisma.user.findUnique({
      where: { id: userId },
      include: {
        roles: { include: { role: true } },
        tenantProfile: true,
        landlordProfile: true,
        wallet: true,
      },
    });
  }

  /**
   * Update the specific Trust Profile status (Tenant or Landlord)
   */
  async updateUserKycStatus(userId: string, role: string, status: string) {
    if (role === "TENANT") {
      return await prisma.tenantTrustProfile.update({
        where: { userRefId: userId },
        data: {
          kyc_status: status,
          ktpVerifiedAt: status === "VERIFIED" ? new Date() : null,
        },
      });
    } else {
      return await prisma.landlordTrustProfile.update({
        where: { userRefId: userId },
        data: {
          kyc_status: status,
          ktpVerifiedAt: status === "VERIFIED" ? new Date() : null,
        },
      });
    }
  }

  /**
   * Update the main User verified flag
   */
  async setUserVerified(userId: string, isVerified: boolean) {
    return await prisma.user.update({
      where: { id: userId },
      data: { isVerified },
    });
  }

  /**
   * [NEW] Find Property with Landlord info (for notification)
   */
  async findPropertyById(id: string) {
    return await prisma.property.findUnique({
      where: { id },
      include: { 
        landlord: { select: { id: true, name: true, email: true } } 
      }
    });
  }

  /**
   * [NEW] Update Property Verification Status
   */
  async updatePropertyVerification(id: string, isVerified: boolean) {
    return await prisma.property.update({
      where: { id },
      data: { isVerified },
    });
  }
}

export default new AdminRepository();
