import { Router } from 'express';
import * as userController from './user.controller';
import * as userValidation from './user.validation';
import validate from '../../middleware/validate';
import { authenticate } from '../../middleware/auth';
import { authorize } from '../../middleware/authorize';

const router = Router();

// Public routes
router.get('/guides', validate(userValidation.getGuidesSchema), userController.getGuides);
router.get('/:id', validate(userValidation.getUserSchema), userController.getUserById);

// Protected routes
router.use(authenticate);

router.patch('/:id', validate(userValidation.updateUserSchema), userController.updateUser);

// Admin only routes
router.get(
  '/',
  authorize('ADMIN'),
  validate(userValidation.getUsersSchema),
  userController.getUsers
);
router.patch(
  '/:id/status',
  authorize('ADMIN'),
  validate(userValidation.updateUserStatusSchema),
  userController.updateUserStatus
);
router.delete(
  '/:id',
  authorize('ADMIN'),
  validate(userValidation.getUserSchema),
  userController.deleteUser
);

export default router;