import { Request, Response, NextFunction } from 'express';
// [FIX] Use 'ZodType' instead of 'ZodSchema'
import { ZodType, ZodError } from 'zod';
import AppError from '../shared/utils/AppError.js';

/**
 * Higher-Order Function to validate request body against a Zod Schema.
 * @param schema - The Zod schema object (z.object, z.array, etc.)
 */
const validate = (schema: ZodType) => async (req: Request, res: Response, next: NextFunction) => {
  try {
    // 1. Validate & Transform
    // parseAsync allows for async refinements
    const parsedBody = await schema.parseAsync(req.body);

    // 2. Replace req.body with valid/transformed data
    req.body = parsedBody;

    next();
  } catch (error) {
    // 3. Handle Zod Errors
    if (error instanceof ZodError) {
      const errorMessage = error.issues
        .map((issue) => {
          const path = issue.path.join('.');
          return path ? `${path}: ${issue.message}` : issue.message;
        })
        .join(', ');

      // Pass to Global Error Handler as 400 Bad Request
      return next(new AppError(`Validation Error: ${errorMessage}`, 400));
    }

    // Pass unexpected errors
    next(error);
  }
};

export default validate;