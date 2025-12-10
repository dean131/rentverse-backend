import { Request, Response } from "express";
import disputeService from "./dispute.service.js";
import catchAsync from "../../shared/utils/catchAsync.js";
import { sendSuccess } from "../../shared/utils/response.helper.js";

class DisputeController {
  // User Create
  create = catchAsync(async (req: Request, res: Response) => {
    const { id: bookingId } = req.params;
    const dispute = await disputeService.createDispute(
      req.user!.id,
      bookingId,
      req.body
    );
    return sendSuccess(res, dispute, "Dispute submitted successfully");
  });

  // [NEW] Admin List
  getAll = catchAsync(async (req: Request, res: Response) => {
    const { status } = req.query;
    const disputes = await disputeService.getAllDisputes(status as string);
    return sendSuccess(res, disputes, "Disputes retrieved successfully");
  });

  // [NEW] Admin Resolve
  resolve = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await disputeService.resolveDispute(
      req.user!.id,
      id,
      req.body
    );
    return sendSuccess(res, result, "Dispute resolved successfully");
  });

  /**
   * [NEW] Get My Disputes
   */
  getMine = catchAsync(async (req: Request, res: Response) => {
    const disputes = await disputeService.getMyDisputes(req.user!.id);
    return sendSuccess(res, disputes, "My disputes retrieved successfully");
  });
}

export default new DisputeController();