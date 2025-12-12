import { Prisma } from "@prisma/client";
import prisma from "../../config/prisma.js";
import logger from "config/logger.js";

class AuthRepository {
  async findUserByEmail(email: string) {
    return await prisma.user.findUnique({
      where: { email },
      include: { roles: { include: { role: true } } },
    });
  }

  async findUserByPhone(phone: string) {
    return await prisma.user.findUnique({ where: { phone } });
  }

  async findUserById(id: string) {
    return await prisma.user.findUnique({
      where: { id },
      include: { roles: { include: { role: true } } },
    });
  }

  async findUserByIdWithProfiles(id: string) {
    return await prisma.user.findUnique({
      where: { id },
      include: {
        roles: { include: { role: true } },
        tenantProfile: true,
        landlordProfile: true,
      },
    });
  }

  async findRoleByName(name: string) {
    return await prisma.role.findUnique({ where: { name } });
  }

  /**
   * Atomic Transaction: Create User + Assign Role + Initialize Trust Profile
   */
  async createUserWithProfile(
    userData: Prisma.UserCreateInput,
    roleId: string,
    roleName: "TENANT" | "LANDLORD"
  ) {
    return await prisma.$transaction(async (tx) => {
      // 1. Create Base User
      const user = await tx.user.create({
        data: {
          ...userData,
          roles: {
            create: [{ roleId }],
          },
        },
      });

      // 2. Create Trust Profile based on Role
      if (roleName === "TENANT") {
        await tx.tenantTrustProfile.create({
          data: { userRefId: user.id, tti_score: 50.0 },
        });
      } else if (roleName === "LANDLORD") {
        await tx.landlordTrustProfile.create({
          data: { userRefId: user.id, lrs_score: 50.0 },
        });
      }

      return user;
    });
  }

  async updateUser(userId: string, data: Prisma.UserUpdateInput) {
    return await prisma.user.update({
      where: { id: userId },
      data,
    });
  }

  /**
   * Find user by Email OR Phone
   * Used for OTP verification to find the account regardless of channel.
   */
  async findUserByEmailOrPhone(contact: string) {
    return await prisma.user.findFirst({
      where: {
        OR: [{ email: contact }, { phone: contact }],
      },
    });
  }

  /**
   * Update User Verification Status
   * Dynamically updates emailVerifiedAt or phoneVerifiedAt
   */
  async updateUserVerification(
    userId: string,
    data: {
      emailVerifiedAt?: Date;
      phoneVerifiedAt?: Date;
      isVerified?: boolean;
    }
  ) {
    return await prisma.user.update({
      where: { id: userId },
      data: data,
    });
  }

  /**
   * [NEW] Centralized Verification Logic
   * Checks Email, Phone, and KYC status. If all pass, promotes user to isVerified=true.
   */
  async refreshUserVerification(userId: string) {
    // 1. Fetch User with all necessary relations
    const user = await this.findUserByIdWithProfiles(userId);

    if (!user) return null;

    // 2. Check Conditions
    const isEmailDone = !!user.emailVerifiedAt;
    const isPhoneDone = !!user.phoneVerifiedAt;

    const kycStatus =
      user.tenantProfile?.kyc_status || user.landlordProfile?.kyc_status;
    const isKycDone = kycStatus === "VERIFIED";

    const shouldBeVerified = isEmailDone && isPhoneDone && isKycDone;

    // 3. Update if changed
    if (user.isVerified !== shouldBeVerified) {
      await prisma.user.update({
        where: { id: userId },
        data: { isVerified: shouldBeVerified },
      });
      // Optional: Log it
      logger.info(`[Auth] User ${userId} verification status auto-updated to ${shouldBeVerified}`);
    }

    return shouldBeVerified;
  }
}

export default new AuthRepository();
