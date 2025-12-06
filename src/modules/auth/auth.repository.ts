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

  async createUserWithProfile(
    userData: Prisma.UserCreateInput,
    roleId: string,
    roleName: "TENANT" | "LANDLORD"
  ) {
    return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // 1. Create Base User
      const user = await tx.user.create({
        data: {
          ...userData,
          roles: {
            create: [{ roleId }],
          },
        },
      });

      // 2. Create Empty Trust Profile
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