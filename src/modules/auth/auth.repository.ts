import { Prisma } from '../../shared/prisma-client/index.js';
import prisma from '../../config/prisma.js';

class AuthRepository {
  /**
   * Find user by email, including their role details.
   */
  async findUserByEmail(email: string) {
    return await prisma.user.findUnique({
      where: { email },
      include: {
        roles: { include: { role: true } }, // Eager load role
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
    roleName: 'TENANT' | 'LANDLORD'
  ) {
    // 2. Tambahkan tipe ': Prisma.TransactionClient' pada parameter tx
    return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      
      // Sekarang 'tx' memiliki intellisense lengkap (tx.user, tx.role, dll)
      const user = await tx.user.create({
        data: {
          ...userData,
          roles: {
            create: [{ roleId }],
          },
        },
      });

      if (roleName === 'TENANT') {
        await tx.tenantTrustProfile.create({
          data: { userRefId: user.id, tti_score: 50.0 },
        });
      } else if (roleName === 'LANDLORD') {
        await tx.landlordTrustProfile.create({
          data: { userRefId: user.id, lrs_score: 50.0 },
        });
      }

      return user;
    });
  }
}

export default new AuthRepository();