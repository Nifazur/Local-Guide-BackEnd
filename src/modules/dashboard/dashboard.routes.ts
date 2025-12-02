import { Router } from 'express';
import * as dashboardController from './dashboard.controller';
import { authenticate } from '../../middleware/auth';
import { authorize } from '../../middleware/authorize';

const router = Router();

router.use(authenticate);

// Get dashboard based on role
router.get('/', dashboardController.getDashboard);

// Role-specific dashboards
router.get('/admin', authorize('ADMIN'), dashboardController.getAdminDashboard);
router.get('/guide', authorize('GUIDE'), dashboardController.getGuideDashboard);
router.get('/tourist', authorize('TOURIST'), dashboardController.getTouristDashboard);

export default router;