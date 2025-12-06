import { Request, Response } from "express";
import kycService from "./kyc.service.js";
import catchAsync from "../../shared/utils/catchAsync.js";
import { sendSuccess } from "../../shared/utils/response.helper.js";

class KycController {
  submit = catchAsync(async (req: Request, res: Response) => {
    // Files are mapped by field name
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    
    const result = await kycService.submitKyc(req.user!.id, files);
    return sendSuccess(res, result, "KYC submitted successfully");
  });
}

export default new KycController();