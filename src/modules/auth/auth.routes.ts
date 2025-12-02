import { Router } from 'express';
import * as authController from './auth.controller';
import * as authValidation from './auth.validation';
import validate from '../../middleware/validate';
import { authenticate } from '../../middleware/auth';

const router = Router();

router.post('/register', validate(authValidation.registerSchema), authController.register);
router.post('/login', validate(authValidation.loginSchema), authController.login);
router.post('/logout', authController.logout);
router.patch(
  '/change-password',
  authenticate,
  validate(authValidation.changePasswordSchema),
  authController.changePassword
);
router.get('/me', authenticate, authController.getMe);

export default router;