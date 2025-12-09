import { Router } from "express";
import adminController from "./admin.controller.js";
import { verifyToken, requireRole } from "../../middleware/auth.middleware.js";
import validate from "../../middleware/validate.middleware.js";
import { listUsersSchema } from "./admin.schema.js";

const router = Router();

// Global Guard: All Admin routes require Login + 'ADMIN' Role
router.use(verifyToken, requireRole("ADMIN"));

// User Management
router.get(
  "/users",
  validate(listUsersSchema, "query"), // Validates req.query
  adminController.getUsers
);

export default router;