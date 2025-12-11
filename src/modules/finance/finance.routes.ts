import { Router } from "express";
import financeController from "./finance.controller.js";
import validate from "../../middleware/validate.middleware.js";
import { payoutRequestSchema } from "./finance.schema.js";
import { verifyToken, requireRole } from "../../middleware/auth.middleware.js";

const router = Router();

router.use(verifyToken);

// ==========================
// USER ROUTES (Tenant/Landlord)
// ==========================
// 1. Get Wallet
router.get("/wallet", financeController.getWallet);

// 2. Request Payout (Landlord Only)
router.post(
  "/payout",
  requireRole("LANDLORD"),
  validate(payoutRequestSchema),
  financeController.requestPayout
);

// ==========================
// ADMIN ROUTES
// ==========================
router.get(
  "/admin/payouts",
  requireRole("ADMIN"),
  financeController.getAllPayouts
);

router.post(
  "/admin/payouts/:id/process",
  requireRole("ADMIN"),
  // Optional: Add a Zod schema here for body { action, notes } if you want strict validation
  financeController.processPayout
);

export default router;