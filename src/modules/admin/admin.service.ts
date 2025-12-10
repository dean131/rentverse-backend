import adminRepository from "./admin.repository.js";
import { ListUsersQuery } from "./admin.schema.js";
import { env } from "../../config/env.js";
import storageService from "shared/services/storage.service.js";
import AppError from "shared/utils/AppError.js";

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
        roles: user.roles,
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

  /**
   * [NEW] Get User Details + Decrypt KYC Images
   */
  async getUserDetails(userId: string) {
    const user = await adminRepository.findUserById(userId);
    if (!user) throw new AppError("User not found", 404);

    // 1. Determine Roles
    const roles = user.roles.map((r) => r.role.name);

    // 2. Prepare KYC Data (Securely Generate Signed URLs)
    let kycData: any = null;

    // A. Check Tenant Profile
    if (user.tenantProfile) {
      kycData = {
        role: "TENANT",
        status: user.tenantProfile.kyc_status,
        score: user.tenantProfile.tti_score,
        // Generate Signed URLs for Private Buckets
        ktpUrl: user.tenantProfile.ktpUrl 
          ? await storageService.getPresignedUrl(user.tenantProfile.ktpUrl) 
          : null,
        selfieUrl: user.tenantProfile.selfieUrl 
          ? await storageService.getPresignedUrl(user.tenantProfile.selfieUrl) 
          : null,
      };
    } 
    // B. Check Landlord Profile (If not tenant, or if they have both, prioritize primary context)
    // Note: If a user is BOTH, you might want to return an array or object with both.
    // For simplicity, we'll override if they are a Landlord (or you can merge).
    if (user.landlordProfile) {
      const landlordKyc = {
        role: "LANDLORD",
        status: user.landlordProfile.kyc_status,
        score: user.landlordProfile.lrs_score,
        ktpUrl: user.landlordProfile.ktpUrl 
          ? await storageService.getPresignedUrl(user.landlordProfile.ktpUrl) 
          : null,
      };
      // If they are both, maybe return both? For now, let's attach Landlord data.
      if (kycData) kycData.landlordContext = landlordKyc;
      else kycData = landlordKyc;
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      avatarUrl: this.transformUrl(user.avatarUrl),
      isVerified: user.isVerified,
      roles,
      createdAt: user.createdAt,
      
      // Financial Info
      wallet: user.wallet ? {
        balance: Number(user.wallet.balance),
        currency: user.wallet.currency
      } : null,

      // Verification Data (with Signed URLs)
      kyc: kycData
    };
  }
}

export default new AdminService();
