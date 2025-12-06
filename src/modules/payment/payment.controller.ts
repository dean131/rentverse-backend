import { Request, Response } from 'express';
import paymentService from './payment.service.js';
import catchAsync from '../../shared/utils/catchAsync.js';
import { sendSuccess } from '../../shared/utils/response.helper.js';

class PaymentController {
  /**
   * POST /payments/pay/:invoiceId
   */
  pay = catchAsync(async (req: Request, res: Response) => {
    const { invoiceId } = req.params;
    const result = await paymentService.createTransaction(req.user!.id, invoiceId);
    return sendSuccess(res, result, 'Payment token generated');
  });

  /**
   * POST /payments/webhook
   * Public endpoint called by Midtrans
   */
  webhook = catchAsync(async (req: Request, res: Response) => {
    // Midtrans expects 200 OK immediately
    // We process logic in background (or await if fast enough)
    await paymentService.handleWebhook(req.body);
    
    // Always return 200 to Midtrans so they don't retry unnecessarily
    res.status(200).send('OK');
  });
}

export default new PaymentController();