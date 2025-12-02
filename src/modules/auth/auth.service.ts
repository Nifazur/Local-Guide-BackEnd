import { PrismaClient, UserRole } from '@prisma/client';
import ApiError from '../../utils/ApiError';
import {
  hashPassword,
  comparePassword,
  generateToken,
  sanitizeUser,
} from '../../utils/helpers';
import { IRegisterInput, IAuthResponse, IUser, ISanitizedUser } from '../../types';

const prisma = new PrismaClient();

export const register = async (userData: IRegisterInput): Promise<IAuthResponse> => {
  const { email, password, name, role, phone, languages } = userData;

  // Check if user exists
  const existingUser = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (existingUser) {
    throw ApiError.conflict('User with this email already exists');
  }

  // Hash password
  const hashedPassword = await hashPassword(password);

  // Create user
  const user = await prisma.user.create({
    data: {
      email: email.toLowerCase(),
      password: hashedPassword,
      name,
      role: (role as UserRole) || UserRole.TOURIST,
      phone: phone || null,
      languages: languages || [],
    },
  });

  // Generate token
  const token = generateToken({ id: user.id, role: user.role });

  return {
    user: sanitizeUser(user as unknown as IUser)!,
    token,
  };
};

export const login = async (email: string, password: string): Promise<IAuthResponse> => {
  // Find user
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (!user) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  if (!user.isActive) {
    throw ApiError.unauthorized('Your account has been deactivated');
  }

  // Check password
  const isPasswordValid = await comparePassword(password, user.password);

  if (!isPasswordValid) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  // Generate token
  const token = generateToken({ id: user.id, role: user.role });

  return {
    user: sanitizeUser(user as unknown as IUser)!,
    token,
  };
};

export const changePassword = async (
  userId: string,
  currentPassword: string,
  newPassword: string
): Promise<boolean> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw ApiError.notFound('User not found');
  }

  // Check current password
  const isPasswordValid = await comparePassword(currentPassword, user.password);

  if (!isPasswordValid) {
    throw ApiError.unauthorized('Current password is incorrect');
  }

  // Hash new password
  const hashedPassword = await hashPassword(newPassword);

  // Update password
  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword },
  });

  return true;
};

export const getMe = async (userId: string): Promise<ISanitizedUser & { _count: object }> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      _count: {
        select: {
          listings: true,
          bookingsAsTourist: true,
          bookingsAsGuide: true,
          reviewsReceived: true,
        },
      },
    },
  });

  if (!user) {
    throw ApiError.notFound('User not found');
  }

  const sanitized = sanitizeUser(user as unknown as IUser)!;
  return { ...sanitized, _count: user._count };
};