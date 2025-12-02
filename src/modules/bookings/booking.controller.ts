import { Request, Response } from 'express';
import * as bookingService from './booking.service';
import asyncHandler from '../../utils/asyncHandler';
import ApiResponse from '../../utils/ApiResponse';
import { UserRole } from '@prisma/client';

export const createBooking = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const booking = await bookingService.createBooking(req.user!.id, req.body);

  res.status(201).json(ApiResponse.created(booking, 'Booking request sent successfully'));
});

export const getBookings = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const result = await bookingService.getBookings(
    req.user!.id,
    req.user!.role as UserRole,
    req.query
  );

  res
    .status(200)
    .json(
      ApiResponse.paginated(result.bookings, result.pagination, 'Bookings retrieved successfully')
    );
});

export const getBookingById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const booking = await bookingService.getBookingById(
    req.params.id,
    req.user!.id,
    req.user!.role as UserRole
  );

  res.status(200).json(ApiResponse.success(booking, 'Booking retrieved successfully'));
});

export const updateBookingStatus = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const booking = await bookingService.updateBookingStatus(
      req.params.id,
      req.body.status,
      req.user!.id,
      req.user!.role as UserRole
    );

    res
      .status(200)
      .json(
        ApiResponse.success(booking, `Booking ${req.body.status.toLowerCase()} successfully`)
      );
  }
);

export const completeBooking = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const booking = await bookingService.completeBooking(
    req.params.id,
    req.user!.id,
    req.user!.role as UserRole
  );

  res.status(200).json(ApiResponse.success(booking, 'Booking completed successfully'));
});

export const getBookingStats = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const stats = await bookingService.getBookingStats(req.user!.id, req.user!.role as UserRole);

  res.status(200).json(ApiResponse.success(stats, 'Booking stats retrieved successfully'));
});