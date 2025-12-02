import { Router } from 'express';
import * as bookingController from './booking.controller';
import * as bookingValidation from './booking.validation';
import validate from '../../middleware/validate';
import { authenticate } from '../../middleware/auth';
import { authorize } from '../../middleware/authorize';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Tourist routes
router.post(
  '/',
  authorize('TOURIST'),
  validate(bookingValidation.createBookingSchema),
  bookingController.createBooking
);

// Common routes
router.get('/', validate(bookingValidation.getBookingsSchema), bookingController.getBookings);
router.get('/stats', bookingController.getBookingStats);
router.get('/:id', validate(bookingValidation.getBookingSchema), bookingController.getBookingById);

// Update status (guide/admin)
router.patch(
  '/:id/status',
  validate(bookingValidation.updateBookingStatusSchema),
  bookingController.updateBookingStatus
);

// Complete booking (guide only)
router.patch(
  '/:id/complete',
  authorize('GUIDE', 'ADMIN'),
  validate(bookingValidation.completeBookingSchema),
  bookingController.completeBooking
);

export default router;