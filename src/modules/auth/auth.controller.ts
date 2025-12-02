import { Request, Response } from 'express';
import * as authService from './auth.service';
import asyncHandler from '../../utils/asyncHandler';
import ApiResponse from '../../utils/ApiResponse';
import config from '../../config';

export const register = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const result = await authService.register(req.body);

  // Set cookie
  res.cookie('token', result.token, {
    httpOnly: true,
    secure: config.nodeEnv === 'production',
    sameSite: 'lax',
    maxAge: config.jwt.cookieExpiresIn * 24 * 60 * 60 * 1000,
  });

  res.status(201).json(ApiResponse.created(result, 'Registration successful'));
});

export const login = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;
  const result = await authService.login(email, password);

  // Set cookie
  res.cookie('token', result.token, {
    httpOnly: true,
    secure: config.nodeEnv === 'production',
    sameSite: 'lax',
    maxAge: config.jwt.cookieExpiresIn * 24 * 60 * 60 * 1000,
  });

  res.status(200).json(ApiResponse.success(result, 'Login successful'));
});

export const logout = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  res.cookie('token', '', {
    httpOnly: true,
    expires: new Date(0),
  });

  res.status(200).json(ApiResponse.success(null, 'Logged out successfully'));
});

export const changePassword = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { currentPassword, newPassword } = req.body;
  await authService.changePassword(req.user!.id, currentPassword, newPassword);

  res.status(200).json(ApiResponse.success(null, 'Password changed successfully'));
});

export const getMe = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const user = await authService.getMe(req.user!.id);

  res.status(200).json(ApiResponse.success(user, 'User profile retrieved'));
});