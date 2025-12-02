import { Router } from 'express';
import * as listingController from './listing.controller';
import * as listingValidation from './listing.validation';
import validate from '../../middleware/validate';
import { authenticate } from '../../middleware/auth';
import { authorize } from '../../middleware/authorize';

const router = Router();

// Public routes
router.get('/', validate(listingValidation.getListingsSchema), listingController.getListings);
router.get('/:id', validate(listingValidation.getListingSchema), listingController.getListingById);

// Protected routes
router.use(authenticate);

// Guide routes
router.post(
  '/',
  authorize('GUIDE'),
  validate(listingValidation.createListingSchema),
  listingController.createListing
);
router.get(
  '/my/listings',
  authorize('GUIDE'),
  validate(listingValidation.getMyListingsSchema),
  listingController.getMyListings
);
router.patch(
  '/:id',
  authorize('GUIDE', 'ADMIN'),
  validate(listingValidation.updateListingSchema),
  listingController.updateListing
);
router.delete(
  '/:id',
  authorize('GUIDE', 'ADMIN'),
  validate(listingValidation.getListingSchema),
  listingController.deleteListing
);

export default router;