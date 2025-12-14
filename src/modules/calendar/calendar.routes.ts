import { Router } from "express";
import calendarController from "./calendar.controller.js";

const router = Router();

// Public Route (Airbnb needs to access this without a token)
router.get("/export/:propertyId", calendarController.exportIcal);

export default router;