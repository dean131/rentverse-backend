import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import AppError from '../shared/utils/AppError.js';
import authRepository from '../modules/auth/auth.repository.js'; // [FIX] Import Repository
import catchAsync from '../shared/utils/catchAsync.js';

interface JWTPayload {
  id: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

export const verifyToken = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  let token: string | undefined;

  if (authHeader && authHeader.startsWith('Bearer')) {
    token = authHeader.split(' ')[1];
  }

  if (!token) {
    throw new AppError('You are not logged in. Please log in to get access.', 401);
  }

  const decoded = await new Promise<JWTPayload>((resolve, reject) => {
    jwt.verify(token!, env.JWT_SECRET, (err, decoded) => {
      if (err) return reject(new AppError('Invalid or expired token', 401));
      resolve(decoded as JWTPayload);
    });
  });

  // [FIX] Use Repository to check user existence
  const currentUser = await authRepository.findUserById(decoded.id);

  if (!currentUser) {
    throw new AppError('The user belonging to this token no longer exists.', 401);
  }

  const primaryRole = currentUser.roles.length > 0 ? currentUser.roles[0].role.name : 'UNKNOWN';

  req.user = {
    id: currentUser.id,
    email: currentUser.email,
    role: primaryRole,
  };

  next();
});

export const requireRole = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new AppError('You do not have permission to perform this action', 403));
    }
    next();
  };
};