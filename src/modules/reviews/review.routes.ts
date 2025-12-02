import { Router } from 'express';
import * as reviewController from './review.controller';
import * as reviewValidation from './review.validation';
import validate from '../../middleware/validate';
import { authenticate } from '../../middleware/auth';
import { authorize } from '../../middleware/authorize';

const router = Router();

// Public routes
router.get('/', validate(reviewValidation.getReviewsSchema), reviewController.getReviews);
router.get('/guide/:guideId', reviewController.getGuideReviews);
router.get('/:id', validate(reviewValidation.getReviewSchema), reviewController.getReviewById);

// Protected routes
router.use(authenticate);

router.post(
  '/',
  authorize('TOURIST'),
  validate(reviewValidation.createReviewSchema),
  reviewController.createReview
);
router.get(
  '/my/reviews',
  authorize('TOURIST'),
  validate(reviewValidation.getMyReviewsSchema),
  reviewController.getMyReviews
);
router.patch(
  '/:id',
  authorize('TOURIST'),
  validate(reviewValidation.updateReviewSchema),
  reviewController.updateReview
);
router.delete(
  '/:id',
  authorize('TOURIST', 'ADMIN'),
  validate(reviewValidation.getReviewSchema),
  reviewController.deleteReview
);

export default router;