import { Response } from 'express';

/**
 * Standard Success Response
 */
export const sendSuccess = (res: Response, data: any, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({
    status: 'success',
    message,
    data,
  });
};

/**
 * Standard Paginated Response
 */
export const sendPaginated = (res: Response, data: any[], total: number, page: number, limit: number, message = 'Success') => {
  const totalPages = Math.ceil(total / limit);
  
  return res.status(200).json({
    status: 'success',
    message,
    meta: {
      page: Number(page),
      limit: Number(limit),
      totalData: total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
    data,
  });
};