import storageService from "../../shared/services/storage.service.js";
import AppError from "../../shared/utils/AppError.js";
import eventBus from "../../shared/bus/event-bus.js";
import prisma from "../../config/prisma.js";

class KycService {
  async submitKyc(
    userId: string,
    files: { [fieldname: string]: Express.Multer.File[] }
  ) {
    // 1. Validation Logic (Files existence)
    const ktpFile = files["ktp"]?.[0];
    const selfieFile = files["selfie"]?.[0];
    if (!ktpFile) throw new AppError("Identity Card (KTP) is required", 400);

    // 2. ATOMIC TRANSACTION
    // We do everything inside here to prevent race conditions (Double Submission)
    return await prisma.$transaction(async (tx) => {
      // A. Fetch User & Current Status
      // We read the latest state inside the transaction scope
      const user = await tx.user.findUnique({
        where: { id: userId },
        include: {
          roles: { include: { role: true } },
          tenantProfile: true,
          landlordProfile: true,
        },
      });

      if (!user) throw new AppError("User not found", 404);
      const role = user.roles[0].role.name;

      // B. Strict Idempotency Check
      // Prevent "Vote Banyak Kali" (Multiple Submissions)
      let currentStatus = "";
      if (role === "TENANT")
        currentStatus = user.tenantProfile?.kyc_status || "";
      else currentStatus = user.landlordProfile?.kyc_status || "";

      // Fail immediately if already processed
      if (["SUBMITTED", "VERIFIED"].includes(currentStatus)) {
        throw new AppError(
          "KYC already submitted or verified. Please wait for review.",
          409
        );
      }

      // C. Upload Files
      // We perform upload inside the flow to ensure we have valid paths before DB commit.
      const ktpPath = await storageService.uploadPrivate(
        ktpFile,
        `kyc/${userId}`
      );

      let selfiePath = undefined;
      if (role === "TENANT") {
        if (!selfieFile)
          throw new AppError("Selfie is required for Tenants", 400);
        selfiePath = await storageService.uploadPrivate(
          selfieFile,
          `kyc/${userId}`
        );
      }

      // D. Update Database (Atomic Update)
      if (role === "TENANT") {
        await tx.tenantTrustProfile.update({
          where: { userRefId: userId },
          data: {
            ktpUrl: ktpPath,
            selfieUrl: selfiePath,
            kyc_status: "SUBMITTED",
          },
        });
      } else {
        await tx.landlordTrustProfile.update({
          where: { userRefId: userId },
          data: { ktpUrl: ktpPath, kyc_status: "SUBMITTED" },
        });
      }

      // E. Trigger Event (Only if transaction succeeds)
      eventBus.publish("KYC:SUBMITTED", { userId, role });

      return { message: "Documents submitted. Verification pending." };
    });
  }
}

export default new KycService();
