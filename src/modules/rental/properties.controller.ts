import { Request, Response } from 'express';
import propertiesService from './properties.service.js';
import catchAsync from '../../shared/utils/catchAsync.js';
import { sendSuccess } from '../../shared/utils/response.helper.js';

class PropertiesController {
  create = catchAsync(async (req: Request, res: Response) => {
    // Files are available in req.files
    const files = req.files as Express.Multer.File[];
    
    // Auth Middleware ensures req.user exists
    const result = await propertiesService.createProperty(
      req.user!.id, 
      req.body, 
      files
    );

    return sendSuccess(res, result, 'Property listed successfully', 201);
  });
}

export default new PropertiesController();