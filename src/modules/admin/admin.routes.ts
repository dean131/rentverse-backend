import { Router } from "express";
import adminController from "./admin.controller.js";
import { verifyToken, requireRole } from "../../middleware/auth.middleware.js";
import validate from "../../middleware/validate.middleware.js";
import { listUsersSchema, verifyUserSchema } from "./admin.schema.js";

const router = Router();

// Global Guard: All Admin routes require Login + 'ADMIN' Role
router.use(verifyToken, requireRole("ADMIN"));

// User Management
router.get(
  "/users",
  validate(listUsersSchema, "query"), // Validates req.query
  adminController.getUsers
);

router.get("/users/:id", adminController.getUser);

// [NEW] Verify
router.post(
  "/users/:id/verify",
  validate(verifyUserSchema),
  adminController.verifyUser
);

export default router;
