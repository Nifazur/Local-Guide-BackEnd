import { Request, Response } from 'express';
import * as dashboardService from './dashboard.service';
import asyncHandler from '../../utils/asyncHandler';
import ApiResponse from '../../utils/ApiResponse';
import { UserRole } from '@prisma/client';

export const getDashboard = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  let data;

  switch (req.user!.role) {
    case UserRole.ADMIN:
      data = await dashboardService.getAdminDashboard();
      break;
    case UserRole.GUIDE:
      data = await dashboardService.getGuideDashboard(req.user!.id);
      break;
    case UserRole.TOURIST:
      data = await dashboardService.getTouristDashboard(req.user!.id);
      break;
    default:
      data = {};
  }

  res.status(200).json(ApiResponse.success(data, 'Dashboard data retrieved successfully'));
});

export const getAdminDashboard = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const data = await dashboardService.getAdminDashboard();

    res.status(200).json(ApiResponse.success(data, 'Admin dashboard data retrieved successfully'));
  }
);

export const getGuideDashboard = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const data = await dashboardService.getGuideDashboard(req.user!.id);

    res.status(200).json(ApiResponse.success(data, 'Guide dashboard data retrieved successfully'));
  }
);

export const getTouristDashboard = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const data = await dashboardService.getTouristDashboard(req.user!.id);

    res
      .status(200)
      .json(ApiResponse.success(data, 'Tourist dashboard data retrieved successfully'));
  }
);