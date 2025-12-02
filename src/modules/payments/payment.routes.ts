import { Router, raw } from 'express';
import * as paymentController from './payment.controller';
import * as paymentValidation from './payment.validation';
import validate from '../../middleware/validate';
import { authenticate } from '../../middleware/auth';
import { authorize } from '../../middleware/authorize';

const router = Router();

// Stripe webhook (no auth required, raw body)
router.post('/webhook', raw({ type: 'application/json' }), paymentController.handleWebhook);

// Protected routes
router.use(authenticate);

// Payment routes
router.post(
  '/create-payment-intent',
  authorize('TOURIST'),
  validate(paymentValidation.createPaymentIntentSchema),
  paymentController.createPaymentIntent
);

router.post(
  '/create-checkout-session',
  authorize('TOURIST'),
  validate(paymentValidation.createPaymentIntentSchema),
  paymentController.createCheckoutSession
);

router.post(
  '/confirm',
  authorize('TOURIST'),
  validate(paymentValidation.confirmPaymentSchema),
  paymentController.confirmPayment
);

router.get('/', validate(paymentValidation.getPaymentsSchema), paymentController.getPayments);
router.get('/stats', paymentController.getPaymentStats);
router.get('/:id', validate(paymentValidation.getPaymentSchema), paymentController.getPaymentById);

// Admin only
router.post(
  '/:id/refund',
  authorize('ADMIN'),
  validate(paymentValidation.refundPaymentSchema),
  paymentController.refundPayment
);

export default router;