import { Request, Response, NextFunction } from 'express';
import { UserRole } from '@prisma/client';
import ApiError from '../utils/ApiError';

export const authorize = (...roles: UserRole[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw ApiError.unauthorized('Please log in to access this resource');
    }

    if (!roles.includes(req.user.role)) {
      throw ApiError.forbidden('You do not have permission to perform this action');
    }

    next();
  };
};

// Check if user owns the resource or is admin
export const authorizeOwner = (
  getResourceOwnerId: (req: Request) => Promise<string>
) => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw ApiError.unauthorized('Please log in to access this resource');
      }

      // Admins can access everything
      if (req.user.role === 'ADMIN') {
        return next();
      }

      const ownerId = await getResourceOwnerId(req);

      if (ownerId !== req.user.id) {
        throw ApiError.forbidden('You do not have permission to access this resource');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};