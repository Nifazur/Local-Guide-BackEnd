import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import config from '../config';
import { IUser, ISanitizedUser, ITokenPayload, IPagination, IPaginationMeta } from '../types';

// Password hashing
export const hashPassword = async (password: string): Promise<string> => {
  return await bcrypt.hash(password, 12);
};

export const comparePassword = async (
  candidatePassword: string,
  hashedPassword: string
): Promise<boolean> => {
  return await bcrypt.compare(candidatePassword, hashedPassword);
};

// JWT functions
export const generateToken = (payload: ITokenPayload): string => {
  return jwt.sign(
    payload,
    config.jwt.secret as jwt.Secret,
    {
      expiresIn: config.jwt.expiresIn as jwt.SignOptions['expiresIn'],
    }
  );
};

export const verifyToken = (token: string): ITokenPayload => {
  return jwt.verify(token, config.jwt.secret) as ITokenPayload;
};

// Pagination helper
export const getPagination = (page: number = 1, limit: number = 10): IPagination => {
  const pageNum = Math.max(1, page);
  const limitNum = Math.min(100, Math.max(1, limit));
  const skip = (pageNum - 1) * limitNum;

  return {
    page: pageNum,
    limit: limitNum,
    skip,
  };
};

export const getPaginationMeta = (
  total: number,
  page: number,
  limit: number
): IPaginationMeta => {
  const totalPages = Math.ceil(total / limit);
  return {
    total,
    page,
    limit,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
};

// Sanitize user object (remove password)
export const sanitizeUser = (user: IUser | null): ISanitizedUser | null => {
  if (!user) return null;
  const { password, ...sanitized } = user;
  return sanitized as ISanitizedUser;
};

// Exclude fields from object
export const excludeFields = <T extends object, K extends keyof T>(
  obj: T,
  fields: K[]
): Omit<T, K> => {
  const result = { ...obj };
  fields.forEach((field) => delete result[field]);
  return result;
};