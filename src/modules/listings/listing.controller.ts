import { Request, Response } from 'express';
import * as listingService from './listing.service';
import asyncHandler from '../../utils/asyncHandler';
import ApiResponse from '../../utils/ApiResponse';
import { UserRole } from '@prisma/client';

export const createListing = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const listing = await listingService.createListing(req.user!.id, req.body);

  res.status(201).json(ApiResponse.created(listing, 'Listing created successfully'));
});

export const getListings = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const result = await listingService.getListings(req.query);

  res
    .status(200)
    .json(
      ApiResponse.paginated(result.listings, result.pagination, 'Listings retrieved successfully')
    );
});

export const getListingById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const listing = await listingService.getListingById(req.params.id);

  res.status(200).json(ApiResponse.success(listing, 'Listing retrieved successfully'));
});

export const updateListing = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const listing = await listingService.updateListing(
    req.params.id,
    req.user!.id,
    req.body,
    req.user!.role as UserRole
  );

  res.status(200).json(ApiResponse.success(listing, 'Listing updated successfully'));
});

export const deleteListing = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  await listingService.deleteListing(req.params.id, req.user!.id, req.user!.role as UserRole);

  res.status(200).json(ApiResponse.success(null, 'Listing deleted successfully'));
});

export const getMyListings = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const result = await listingService.getMyListings(req.user!.id, req.query);

  res
    .status(200)
    .json(
      ApiResponse.paginated(
        result.listings,
        result.pagination,
        'Your listings retrieved successfully'
      )
    );
});