import { Router } from "express";
import adminController from "./admin.controller.js";
import { verifyToken, requireRole } from "../../middleware/auth.middleware.js";
import validate from "../../middleware/validate.middleware.js";
import {
  listUsersSchema,
  verifyUserSchema,
  adjustTrustSchema,
  verifyPropertySchema,
  listPropertiesSchema,
} from "./admin.schema.js";

const router = Router();

// Global Guard: Admin Only
router.use(verifyToken, requireRole("ADMIN"));

// User Management
router.get(
  "/users",
  validate(listUsersSchema, "query"),
  adminController.getUsers
);

router.get("/users/:id", adminController.getUser);

// Verification
router.post(
  "/users/:id/verify",
  validate(verifyUserSchema),
  adminController.verifyUser
);

// Trust Governance
router.post(
  "/trust/adjust",
  validate(adjustTrustSchema),
  adminController.adjustTrust
);

// [NEW] Property Management
router.get(
  "/properties",
  validate(listPropertiesSchema, "query"),
  adminController.getProperties
);

// Property Governance
router.post(
  "/properties/:id/verify",
  validate(verifyPropertySchema),
  adminController.verifyProperty
);

export default router;
