import { Router } from 'express';
import paymentController from './payment.controller.js';
import { verifyToken, requireRole } from '../../middleware/auth.middleware.js';

const router = Router();

// 1. Generate Payment Link (Tenant Only)
router.post(
  '/pay/:invoiceId',
  verifyToken,
  requireRole('TENANT'),
  paymentController.pay
);

// 2. Webhook (Public - Midtrans calls this)
// Security: In production, verify the IP or Signature Header here too
router.post('/webhook', paymentController.webhook);

export default router;