import { Router } from "express";
import financeController from "./finance.controller.js";
import validate from "../../middleware/validate.middleware.js";
import { payoutRequestSchema } from "./finance.schema.js";
import { verifyToken, requireRole } from "../../middleware/auth.middleware.js";

const router = Router();

// 1. Get Wallet (Tenant OR Landlord)
router.get("/wallet", verifyToken, financeController.getWallet);

// 2. Request Payout (Landlord Only)
router.post(
  "/payout",
  verifyToken,
  requireRole("LANDLORD"),
  validate(payoutRequestSchema),
  financeController.requestPayout
);

export default router;
