import { Request, Response } from 'express';
import * as reviewService from './review.service';
import asyncHandler from '../../utils/asyncHandler';
import ApiResponse from '../../utils/ApiResponse';
import { UserRole } from '@prisma/client';

export const createReview = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const review = await reviewService.createReview(req.user!.id, req.body);

  res.status(201).json(ApiResponse.created(review, 'Review submitted successfully'));
});

export const getReviews = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const result = await reviewService.getReviews(req.query);

  res
    .status(200)
    .json(ApiResponse.paginated(result.reviews, result.pagination, 'Reviews retrieved successfully'));
});

export const getReviewById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const review = await reviewService.getReviewById(req.params.id);

  res.status(200).json(ApiResponse.success(review, 'Review retrieved successfully'));
});

export const updateReview = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const review = await reviewService.updateReview(req.params.id, req.user!.id, req.body);

  res.status(200).json(ApiResponse.success(review, 'Review updated successfully'));
});

export const deleteReview = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  await reviewService.deleteReview(req.params.id, req.user!.id, req.user!.role as UserRole);

  res.status(200).json(ApiResponse.success(null, 'Review deleted successfully'));
});

export const getMyReviews = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const result = await reviewService.getMyReviews(req.user!.id, req.query);

  res
    .status(200)
    .json(
      ApiResponse.paginated(result.reviews, result.pagination, 'Your reviews retrieved successfully')
    );
});

export const getGuideReviews = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const result = await reviewService.getGuideReviews(req.params.guideId, req.query);

  res
    .status(200)
    .json(
      ApiResponse.paginated(result.reviews, result.pagination, 'Guide reviews retrieved successfully')
    );
});