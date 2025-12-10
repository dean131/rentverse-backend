import { Prisma } from "@prisma/client";
import prisma from "../../config/prisma.js";

class AdminRepository {
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

    // 1. Filter by Role
    if (filters.role && filters.role !== "ALL") {
      where.roles = { some: { role: { name: filters.role } } };
    }

    // 2. Search
    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: "insensitive" } },
        { email: { contains: filters.search, mode: "insensitive" } },
        { phone: { contains: filters.search } },
      ];
    }

    // 3. Filter by KYC Status
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

    // 4. Transaction
    const [total, users] = await prisma.$transaction([
      // [CRITICAL] count() accepts ONLY 'where'. Do NOT put 'take' here.
      prisma.user.count({ where }),

      // findMany() accepts 'take', 'skip', 'where'
      prisma.user.findMany({
        where,
        skip,
        take, // Ensure this is a number (Fixed in Controller)
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
   * [NEW] Find User with detailed Trust Profiles
   */
  async findUserById(userId: string) {
    return await prisma.user.findUnique({
      where: { id: userId },
      include: {
        roles: { include: { role: true } },
        tenantProfile: true,   // Contains ktpUrl, selfieUrl
        landlordProfile: true, // Contains ktpUrl
        wallet: true,
      },
    });
  }
}

export default new AdminRepository();
