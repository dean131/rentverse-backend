import adminRepository from "./admin.repository.js";
import storageService from "../../shared/services/storage.service.js";
import {
  ListUsersQuery,
  VerifyUserInput,
  AdjustTrustInput,
  VerifyPropertyInput,
} from "./admin.schema.js";
import { env } from "../../config/env.js";
import AppError from "../../shared/utils/AppError.js";
import eventBus from "../../shared/bus/event-bus.js";

class AdminService {
  /**
   * 1. Get List of Users
   */
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
      // Determine Primary Role Context for Table Display
      const roles = user.roles.map((r) => r.role.name);
      let score = 0;
      let kycStatus = "N/A";

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
        avatarUrl: storageService.getPublicUrl(user.avatarUrl),
        roles: roles,
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
   * 2. Get User Details (Secure)
   */
  async getUserDetails(userId: string) {
    const user = await adminRepository.findUserById(userId);
    if (!user) throw new AppError("User not found", 404);

    const roles = user.roles.map((r) => r.role.name);
    let kycData: any = null;

    // A. Tenant Context
    if (user.tenantProfile) {
      kycData = {
        role: "TENANT",
        status: user.tenantProfile.kyc_status,
        score: user.tenantProfile.tti_score,
        ktpUrl: user.tenantProfile.ktpUrl
          ? await storageService.getPresignedUrl(user.tenantProfile.ktpUrl)
          : null,
        selfieUrl: user.tenantProfile.selfieUrl
          ? await storageService.getPresignedUrl(user.tenantProfile.selfieUrl)
          : null,
      };
    }
    // B. Landlord Context
    else if (user.landlordProfile) {
      kycData = {
        role: "LANDLORD",
        status: user.landlordProfile.kyc_status,
        score: user.landlordProfile.lrs_score,
        ktpUrl: user.landlordProfile.ktpUrl
          ? await storageService.getPresignedUrl(user.landlordProfile.ktpUrl)
          : null,
      };
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      avatarUrl: storageService.getPublicUrl(user.avatarUrl),
      isVerified: user.isVerified,
      roles: roles,
      createdAt: user.createdAt,
      wallet: user.wallet
        ? {
            balance: Number(user.wallet.balance),
            currency: user.wallet.currency,
          }
        : null,
      kyc: kycData,
    };
  }

  /**
   * 3. Verify User (Approve/Reject)
   */
  async verifyUser(adminId: string, userId: string, input: VerifyUserInput) {
    const user = await adminRepository.findUserById(userId);
    if (!user) throw new AppError("User not found", 404);

    const role = user.roles[0].role.name; // Simplified: Primary role

    // Update DB
    await adminRepository.updateUserKycStatus(userId, role, input.status);

    // Side Effects
    if (input.status === "VERIFIED") {
      await adminRepository.setUserVerified(userId, true);
      eventBus.publish("KYC:VERIFIED", { userId, role, adminId });
    } else if (input.status === "REJECTED") {
      await adminRepository.setUserVerified(userId, false);
      eventBus.publish("KYC:REJECTED", {
        userId,
        role,
        adminId,
        reason: input.rejectionReason || "Rejected by Admin",
      });
    }

    return { message: `User KYC has been ${input.status.toLowerCase()}` };
  }

  /**
   * 4. Adjust Trust Score (Governance)
   */
  async adjustTrustScore(adminId: string, input: AdjustTrustInput) {
    // Check existence using local repo
    const user = await adminRepository.findUserById(input.userId);
    if (!user) throw new AppError("User not found", 404);

    // Fire Event (Logic handled by TrustModule)
    eventBus.publish("ADMIN:TRUST_SCORE_ADJUSTED", {
      adminId,
      userId: input.userId,
      role: input.role,
      scoreDelta: input.scoreDelta,
      reason: input.reason,
    });

    return {
      message: "Trust adjustment request submitted successfully.",
      details: { userId: input.userId, delta: input.scoreDelta },
    };
  }

  /**
   * [NEW] Verify Property Listing
   */
  async verifyProperty(
    adminId: string,
    propertyId: string,
    input: VerifyPropertyInput
  ) {
    const property = await adminRepository.findPropertyById(propertyId);
    if (!property) throw new AppError("Property not found", 404);

    // 1. Update Database
    await adminRepository.updatePropertyVerification(
      propertyId,
      input.isVerified
    );

    // 2. Publish Events
    if (input.isVerified) {
      eventBus.publish("PROPERTY:VERIFIED", {
        propertyId,
        landlordId: property.landlordId,
        title: property.title,
      });
    } else {
      eventBus.publish("PROPERTY:REJECTED", {
        propertyId,
        landlordId: property.landlordId,
        title: property.title,
        reason: input.rejectionReason || "Admin rejected this listing",
      });
    }

    const action = input.isVerified ? "approved" : "rejected";
    return { message: `Property has been ${action}` };
  }
}

export default new AdminService();
