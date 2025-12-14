import { Router } from "express";
import bookingController from "./booking.controller.js";
import validate from "../../middleware/validate.middleware.js";
import { createBookingSchema, rejectBookingSchema } from "./booking.schema.js";
import { verifyToken, requireRole } from "../../middleware/auth.middleware.js";

const router = Router();

router.get("/availability/:propertyId", bookingController.checkAvailability);

// Only Tenants can book
router.post(
  "/",
  verifyToken,
  requireRole("TENANT"),
  validate(createBookingSchema),
  bookingController.create
);

// Get My Bookings (Tenant & Landlord)
router.get("/", verifyToken, bookingController.getMine);

//  Landlord Routes
router.post(
  "/:id/confirm",
  verifyToken,
  requireRole("LANDLORD"),
  bookingController.confirm
);

router.post(
  "/:id/reject",
  verifyToken,
  requireRole("LANDLORD"),
  validate(rejectBookingSchema),
  bookingController.reject
);

export default router;
