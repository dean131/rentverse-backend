import { Prisma } from "@prisma/client";
import prisma from "../../config/prisma.js";

class AuthRepository {
  /**
   * Find user by email (for Login/Register checks)
   */
  async findUserByEmail(email: string) {
    return await prisma.user.findUnique({
      where: { email },
      include: {
        roles: { include: { role: true } },
      },
    });
  }

  /**
   * Find user by phone (for Register checks)
   */
  async findUserByPhone(phone: string) {
    return await prisma.user.findUnique({
      where: { phone },
    });
  }

  /**
   * Find user by ID (For Middleware/RBAC)
   */
  async findUserById(id: string) {
    return await prisma.user.findUnique({
      where: { id },
      include: {
        roles: { include: { role: true } },
      },
    });
  }

  /**
   * [NEW] Find user by ID with full profiles (For 'Get Me' Endpoint)
   */
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

  /**
   * Find a role by its name (e.g., 'TENANT').
   */
  async findRoleByName(name: string) {
    return await prisma.role.findUnique({
      where: { name },
    });
  }

  /**
   * Transactional creation of User + Role + Trust Profile.
   */
  async createUserWithProfile(
    userData: Prisma.UserCreateInput,
    roleId: string,
    roleName: "TENANT" | "LANDLORD"
  ) {
    return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const user = await tx.user.create({
        data: {
          ...userData,
          roles: {
            create: [{ roleId }],
          },
        },
      });

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
}

export default new AuthRepository();
