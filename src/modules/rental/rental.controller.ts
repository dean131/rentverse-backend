import { Request, Response } from 'express';
import rentalService from './rental.service.js';
import catchAsync from '../../shared/utils/catchAsync.js';
import { sendSuccess } from '../../shared/utils/response.helper.js';

class RentalController {
  /**
   * GET /api/v1/rental/references
   * Public endpoint to fetch master data for dropdowns.
   */
  getReferences = catchAsync(async (req: Request, res: Response) => {
    const result = await rentalService.getAllReferences();
    return sendSuccess(res, result, 'Reference data retrieved successfully');
  });
}

export default new RentalController();