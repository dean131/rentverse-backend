import { Router } from 'express';
import bookingController from './booking.controller.js';
import validate from '../../middleware/validate.middleware.js';
import { createBookingSchema } from './booking.schema.js';
import { verifyToken, requireRole } from '../../middleware/auth.middleware.js';

const router = Router();

// Only Tenants can book
router.post(
  '/',
  verifyToken,
  requireRole('TENANT'),
  validate(createBookingSchema),
  bookingController.create
);

export default router;