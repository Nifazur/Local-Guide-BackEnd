import { Request, Response } from 'express';
import * as paymentService from './payment.service';
import asyncHandler from '../../utils/asyncHandler';
import ApiResponse from '../../utils/ApiResponse';
import { UserRole } from '@prisma/client';

export const createPaymentIntent = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const result = await paymentService.createPaymentIntent(req.user!.id, req.body.bookingId);

    res.status(200).json(ApiResponse.success(result, 'Payment intent created successfully'));
  }
);

export const createCheckoutSession = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const result = await paymentService.createCheckoutSession(req.user!.id, req.body.bookingId);

    res.status(200).json(ApiResponse.success(result, 'Checkout session created successfully'));
  }
);

export const confirmPayment = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const payment = await paymentService.confirmPayment(
    req.user!.id,
    req.body.bookingId,
    req.body.paymentIntentId
  );

  res.status(200).json(ApiResponse.success(payment, 'Payment confirmed successfully'));
});

export const handleWebhook = asyncHandler(async (req, res) => {
  const signature = req.headers["stripe-signature"] as string;
  const rawBody = req.body; // raw buffer

  const result = await paymentService.handleWebhook(rawBody, signature);

  res.status(200).send({ received: true });
});

export const getPayments = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const result = await paymentService.getPayments(
    req.user!.id,
    req.user!.role as UserRole,
    req.query
  );

  res
    .status(200)
    .json(
      ApiResponse.paginated(result.payments, result.pagination, 'Payments retrieved successfully')
    );
});

export const getPaymentById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const payment = await paymentService.getPaymentById(
    req.params.id,
    req.user!.id,
    req.user!.role as UserRole
  );

  res.status(200).json(ApiResponse.success(payment, 'Payment retrieved successfully'));
});

export const refundPayment = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const payment = await paymentService.refundPayment(
    req.params.id,
    req.user!.id,
    req.user!.role as UserRole,
    req.body.reason
  );

  res.status(200).json(ApiResponse.success(payment, 'Payment refunded successfully'));
});

export const getPaymentStats = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const stats = await paymentService.getPaymentStats(req.user!.id, req.user!.role as UserRole);

  res.status(200).json(ApiResponse.success(stats, 'Payment stats retrieved successfully'));
});

export const getPaymentByBookingId = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const payment = await paymentService.getPaymentByBookingId(req.params.bookingId);
  res.status(200).json(ApiResponse.success(payment, 'Payment status retrieved'));
});