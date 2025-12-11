import { Prisma } from "@prisma/client";
import prisma from "../../config/prisma.js";

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
}

export default new AuthRepository();
