import { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import config from '../config';
import ApiError from '../utils/ApiError';

interface PrismaError extends Error {
  code?: string;
  meta?: {
    target?: string[];
  };
}

export const errorHandler: ErrorRequestHandler = (
  err: Error | ApiError | PrismaError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  let error = err;

  // Log error
  console.error('Error:', {
    message: err.message,
    stack: config.nodeEnv === 'development' ? err.stack : undefined,
  });

  // Handle Prisma errors
  const prismaError = err as PrismaError;
  if (prismaError.code === 'P2002') {
    const field = prismaError.meta?.target?.[0] || 'field';
    error = ApiError.conflict(`A record with this ${field} already exists`);
  }

  if (prismaError.code === 'P2025') {
    error = ApiError.notFound('Record not found');
  }

  if (prismaError.code === 'P2003') {
    error = ApiError.badRequest('Invalid reference to related record');
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    error = ApiError.unauthorized('Invalid token');
  }

  if (err.name === 'TokenExpiredError') {
    error = ApiError.unauthorized('Token has expired');
  }

  // Handle validation errors
  if (err.name === 'ValidationError') {
    error = ApiError.badRequest(err.message);
  }

  // If not an ApiError, create one
  if (!(error instanceof ApiError)) {
    error = new ApiError(
      500,
      error.message || 'Internal Server Error',
      [],
      config.nodeEnv === 'development' ? error.stack : ''
    );
  }

  const apiError = error as ApiError;

  res.status(apiError.statusCode).json({
    success: false,
    message: apiError.message,
    errors: apiError.errors,
    ...(config.nodeEnv === 'development' && { stack: apiError.stack }),
  });
};

export const notFoundHandler = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  const error = ApiError.notFound(`Route ${req.originalUrl} not found`);
  next(error);
};