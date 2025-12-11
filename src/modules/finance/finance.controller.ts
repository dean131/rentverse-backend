import { Request, Response } from "express";
import walletService from "./wallet.service.js";
import catchAsync from "../../shared/utils/catchAsync.js";
import { sendSuccess, sendInfiniteList } from "../../shared/utils/response.helper.js"; // [MODIFIED] Added sendInfiniteList

class FinanceController {
  /**
   * Get the current user's wallet balance and transaction history.
   * GET /api/v1/finance/wallet
   */
  getWallet = catchAsync(async (req: Request, res: Response) => {
    // req.user is guaranteed by verifyToken middleware
    const wallet = await walletService.getMyWallet(req.user!.id);
    return sendSuccess(res, wallet, "Wallet retrieved successfully");
  });

  /**
   * Request a payout (withdrawal) from the wallet.
   * POST /api/v1/finance/payout
   */
  requestPayout = catchAsync(async (req: Request, res: Response) => {
    // Service handles atomicity and "Insufficient Balance" errors
    const result = await walletService.requestPayout(req.user!.id, req.body);
    
    return sendSuccess(res, result, "Payout request created successfully", 201);
  });

  /**
   * [NEW] GET /admin/payouts
   */
  getAllPayouts = catchAsync(async (req: Request, res: Response) => {
    const result = await walletService.getAdminPayouts(req.query);
    return sendInfiniteList(res, result.data, result.meta, "Payout requests retrieved");
  });

  /**
   * [NEW] POST /admin/payouts/:id/process
   */
  processPayout = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { action, notes } = req.body; // action: "APPROVE" | "REJECT"
    
    // Simple validation (can be moved to Zod schema)
    if (!["APPROVE", "REJECT"].includes(action)) {
      throw new Error("Invalid action. Must be APPROVE or REJECT"); 
    }

    const result = await walletService.processPayout(req.user!.id, id, action, notes);
    return sendSuccess(res, result, "Payout processed successfully");
  });
}

export default new FinanceController();