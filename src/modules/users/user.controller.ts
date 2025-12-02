import { Request, Response } from 'express';
import * as userService from './user.service';
import asyncHandler from '../../utils/asyncHandler';
import ApiResponse from '../../utils/ApiResponse';
import { UserRole } from '@prisma/client';

export const getUsers = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const result = await userService.getUsers(req.query);

  res
    .status(200)
    .json(ApiResponse.paginated(result.users, result.pagination, 'Users retrieved successfully'));
});

export const getGuides = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const result = await userService.getGuides(req.query);

  res
    .status(200)
    .json(ApiResponse.paginated(result.guides, result.pagination, 'Guides retrieved successfully'));
});

export const getUserById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const user = await userService.getUserById(req.params.id);

  res.status(200).json(ApiResponse.success(user, 'User retrieved successfully'));
});

export const updateUser = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const user = await userService.updateUser(
    req.params.id,
    req.body,
    req.user!.id,
    req.user!.role as UserRole
  );

  res.status(200).json(ApiResponse.success(user, 'User updated successfully'));
});

export const updateUserStatus = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const user = await userService.updateUserStatus(req.params.id, req.body.isActive);

  res
    .status(200)
    .json(
      ApiResponse.success(
        user,
        `User ${req.body.isActive ? 'activated' : 'deactivated'} successfully`
      )
    );
});

export const deleteUser = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  await userService.deleteUser(req.params.id);

  res.status(200).json(ApiResponse.success(null, 'User deleted successfully'));
});