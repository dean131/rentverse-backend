import { Request, Response } from "express";
import walletService from "./wallet.service.js";
import catchAsync from "../../shared/utils/catchAsync.js";
import { sendSuccess } from "../../shared/utils/response.helper.js";

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
}

export default new FinanceController();