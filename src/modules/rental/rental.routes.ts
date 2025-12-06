import { Router } from "express";
import rentalController from "./rental.controller.js";

const router = Router();

// ==========================
// PUBLIC ROUTES
// ==========================
router.get("/references", rentalController.getReferences);

export default router;
