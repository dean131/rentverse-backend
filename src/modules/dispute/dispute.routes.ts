import { Router } from "express";
import disputeController from "./dispute.controller.js";
import { verifyToken, requireRole } from "../../middleware/auth.middleware.js";
import validate from "../../middleware/validate.middleware.js";
import { createDisputeSchema, resolveDisputeSchema } from "./dispute.schema.js";

const router = Router();

router.use(verifyToken);

// =======================
// User Routes (Tenant/Landlord)
// =======================

// 1. Create Dispute
router.post(
  "/bookings/:id/dispute",
  validate(createDisputeSchema),
  disputeController.create
);

// 2. [NEW] Get My Disputes
router.get("/disputes", disputeController.getMine);

// =======================
// Admin Routes
// =======================
router.get("/admin/disputes", requireRole("ADMIN"), disputeController.getAll);
router.post(
  "/admin/disputes/:id/resolve",
  requireRole("ADMIN"),
  validate(resolveDisputeSchema),
  disputeController.resolve
);

export default router;
