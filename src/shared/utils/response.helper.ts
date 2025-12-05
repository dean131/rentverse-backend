import { Response } from "express";

/**
 * Standard Success Response
 */
export const sendSuccess = (
  res: Response,
  data: any,
  message = "Success",
  statusCode = 200
) => {
  return res.status(statusCode).json({
    status: "success",
    message,
    data,
  });
};

/**
 * Standard Infinite Scroll Response
 */
export const sendInfiniteList = (
  res: Response,
  data: any[],
  meta: {
    total: number;
    limit: number;
    nextCursor: string | null;
    hasMore: boolean;
  },
  message = "Success"
) => {
  return res.status(200).json({
    status: "success",
    message,
    meta, // Mobile looks here for "nextCursor"
    data,
  });
};

/**
 * Standard Paginated Response
 */
export const sendPaginated = (
  res: Response,
  data: any[],
  total: number,
  page: number,
  limit: number,
  message = "Success"
) => {
  const totalPages = Math.ceil(total / limit);

  return res.status(200).json({
    status: "success",
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
