import { Router, Request, Response } from 'express';
import authRoutes from '../modules/auth/auth.routes';
import userRoutes from '../modules/users/user.routes';
import listingRoutes from '../modules/listings/listing.routes';
import bookingRoutes from '../modules/bookings/booking.routes';
import reviewRoutes from '../modules/reviews/review.routes';
import paymentRoutes from '../modules/payments/payment.routes';
import dashboardRoutes from '../modules/dashboard/dashboard.routes';
import uploadRoutes from '../modules/uploads/upload.routes';

const router = Router();

// API Info
router.get('/', (_req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Local Guide Platform API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      listings: '/api/listings',
      bookings: '/api/bookings',
      reviews: '/api/reviews',
      payments: '/api/payments',
      dashboard: '/api/dashboard',
      uploads: '/api/uploads',
    },
    documentation: '/api/docs',
  });
});

// API Routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/listings', listingRoutes);
router.use('/bookings', bookingRoutes);
router.use('/reviews', reviewRoutes);
router.use('/payments', paymentRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/uploads', uploadRoutes);

export default router;