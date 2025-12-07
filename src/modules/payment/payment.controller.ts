import { Request, Response } from 'express';
import paymentService from './payment.service.js';
import catchAsync from '../../shared/utils/catchAsync.js';
import { sendSuccess } from '../../shared/utils/response.helper.js';

class PaymentController {
  
  // Endpoint to get Snap Token
  pay = catchAsync(async (req: Request, res: Response) => {
    const { invoiceId } = req.params;
    const result = await paymentService.createTransaction(req.user!.id, invoiceId);
    return sendSuccess(res, result, 'Payment token generated');
  });

  // Endpoint for Midtrans Webhook
  webhook = catchAsync(async (req: Request, res: Response) => {
    // Process asynchronously to not block Midtrans
    await paymentService.handleWebhook(req.body);
    
    // Always return 200 OK to Midtrans immediately
    res.status(200).send('OK');
  });
}

export default new PaymentController();