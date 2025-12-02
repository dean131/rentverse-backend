import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod'; // Import ZodError type
import AppError from '../shared/utils/AppError.js';
import logger from '../config/logger.js';

const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  // 1. Log the error
  logger.error('[ERROR] Global Error Handler Caught:', { 
    message: err.message, 
    stack: err.stack,
    path: req.originalUrl,
    method: req.method
  });

  // 2. Handle Zod Validation Errors
  if (err instanceof ZodError) {
    // FIX: Use 'err.issues' instead of 'err.errors'
    const errorMessage = err.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join(', ');

    return res.status(400).json({
      status: 'fail',
      message: `Validation Error: ${errorMessage}`,
    });
  }

  // 3. Operational, trusted error (AppError)
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  }
  
  // Handle generic operational errors (legacy support)
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  }

  // 4. Programming or unknown error
  return res.status(500).json({
    status: 'error',
    message: 'Internal Server Error',
  });
};

export default errorHandler;