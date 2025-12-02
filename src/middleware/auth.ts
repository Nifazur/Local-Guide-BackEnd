import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import ApiError from '../utils/ApiError';
import asyncHandler from '../utils/asyncHandler';
import { verifyToken, sanitizeUser } from '../utils/helpers';
import { IUser } from '../types';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

export const authenticate = asyncHandler(
  async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    let token: string | undefined;

    // Get token from header or cookie
    if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies?.token) {
      token = req.cookies.token;
    }

    if (!token) {
      throw ApiError.unauthorized('Please log in to access this resource');
    }

    try {
      // Verify token
      const decoded = verifyToken(token);

      // Check if user exists
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
      });

      if (!user) {
        throw ApiError.unauthorized('User no longer exists');
      }

      if (!user.isActive) {
        throw ApiError.unauthorized('Your account has been deactivated');
      }

      // Attach user to request
      req.user = sanitizeUser(user as unknown as IUser)!;
      next();
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw ApiError.unauthorized('Invalid token');
      }
      if (error instanceof jwt.TokenExpiredError) {
        throw ApiError.unauthorized('Token has expired');
      }
      throw error;
    }
  }
);

// Optional authentication - doesn't throw error if no token
export const optionalAuth = asyncHandler(
  async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    let token: string | undefined;

    if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies?.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return next();
    }

    try {
      const decoded = verifyToken(token);
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
      });

      if (user && user.isActive) {
        req.user = sanitizeUser(user as unknown as IUser)!;
      }
    } catch {
      // Silently fail for optional auth
    }

    next();
  }
);
