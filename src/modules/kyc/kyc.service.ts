import storageService from "../../shared/services/storage.service.js";
import kycRepository from "./kyc.repository.js";
import authRepository from "../auth/auth.repository.js"; // To check role
import AppError from "../../shared/utils/AppError.js";

class KycService {
  async submitKyc(userId: string, files: { [fieldname: string]: Express.Multer.File[] }) {
    // 1. Get User Role
    const user = await authRepository.findUserById(userId);
    if (!user) throw new AppError("User not found", 404);
    
    const role = user.roles[0].role.name;

    // 2. Validate Files
    const ktpFile = files['ktp']?.[0];
    const selfieFile = files['selfie']?.[0];

    if (!ktpFile) throw new AppError("KTP image is required", 400);

    // 3. Upload Securely
    const ktpPath = await storageService.uploadPrivate(ktpFile, `kyc/${userId}`);
    
    // 4. Update Profile based on Role
    if (role === 'TENANT') {
      if (!selfieFile) throw new AppError("Selfie is required for Tenants", 400);
      const selfiePath = await storageService.uploadPrivate(selfieFile, `kyc/${userId}`);
      
      await kycRepository.updateTenantKyc(userId, { ktpUrl: ktpPath, selfieUrl: selfiePath });
    } else {
      await kycRepository.updateLandlordKyc(userId, { ktpUrl: ktpPath });
    }

    return { message: "KYC submitted successfully. Pending verification." };
  }
}

export default new KycService();