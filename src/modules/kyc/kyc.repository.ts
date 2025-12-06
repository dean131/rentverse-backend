import prisma from "../../config/prisma.js";

class KycRepository {
  async updateTenantKyc(userId: string, data: { ktpUrl: string; selfieUrl: string }) {
    return await prisma.tenantTrustProfile.update({
      where: { userRefId: userId },
      data: {
        ktpUrl: data.ktpUrl,
        selfieUrl: data.selfieUrl,
        kyc_status: "SUBMITTED",
      },
    });
  }

  async updateLandlordKyc(userId: string, data: { ktpUrl: string }) {
    return await prisma.landlordTrustProfile.update({
      where: { userRefId: userId },
      data: {
        ktpUrl: data.ktpUrl,
        kyc_status: "SUBMITTED",
      },
    });
  }
}

export default new KycRepository();