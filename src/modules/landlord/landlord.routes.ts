import { Router } from "express";
import landlordController from "./landlord.controller.js";
import { verifyToken, requireRole } from "../../middleware/auth.middleware.js";

const router = Router();

// Global Guard: All routes strictly for LANDLORDS
router.use(verifyToken, requireRole("LANDLORD"));

// Dashboard Stats
router.get("/dashboard", landlordController.getDashboard);

// Inventory Management
// Supports: ?limit=10&cursor=...&search=...
router.get("/properties", landlordController.getProperties);

export default router;
