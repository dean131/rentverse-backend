import adminRepository from "./admin.repository.js";
import { ListUsersQuery } from "./admin.schema.js";
import { env } from "../../config/env.js";

class AdminService {
  private transformUrl(url: string | null | undefined) {
    if (!url) return null;
    return url.startsWith("http") ? url : `${env.MINIO_URL}/${url}`;
  }

  async getAllUsers(query: ListUsersQuery) {
    const page = query.page;
    const limit = query.limit;
    const skip = (page - 1) * limit;

    const { total, users } = await adminRepository.findAllUsers(skip, limit, {
      search: query.search,
      role: query.role === "ALL" ? undefined : (query.role as any),
      kycStatus: query.kycStatus,
    });

    const data = users.map((user) => {
      // Determine Primary Role & Score
      // (A user can theoretically be both, but usually has one primary active role context)
      const roleNames = user.roles.map((r) => r.role.name);
      let score = 0;
      let kycStatus = "N/A";

      // Priority: Check Tenant first, then Landlord
      if (user.tenantProfile) {
        score = user.tenantProfile.tti_score;
        kycStatus = user.tenantProfile.kyc_status;
      } else if (user.landlordProfile) {
        score = user.landlordProfile.lrs_score;
        kycStatus = user.landlordProfile.kyc_status;
      }

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        avatarUrl: this.transformUrl(user.avatarUrl),
        roles: roleNames,
        trustScore: score,
        kycStatus: kycStatus,
        joinedAt: user.createdAt,
      };
    });

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}

export default new AdminService();
