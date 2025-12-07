import { Router } from 'express';
import paymentController from './payment.controller.js';
import { verifyToken, requireRole } from '../../middleware/auth.middleware.js';

const router = Router();

// Protected: Generate Token (Tenant Only)
router.post(
  '/pay/:invoiceId',
  verifyToken,
  requireRole('TENANT'),
  paymentController.pay
);

// Public: Webhook Handler
// Note: Midtrans IPs should ideally be whitelisted in a real firewall
router.post('/webhook', paymentController.webhook);

export default router;