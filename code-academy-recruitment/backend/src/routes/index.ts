import { Router } from 'express';
import authRoutes from './auth.routes';
import applicationRoutes from './application.routes';
import interviewRoutes from './interview.routes';
import adminRoutes from './admin.routes';
import interviewerRoutes from './interviewer.routes';
import { authenticate, authorize } from '../middlewares/auth';
import { UserRole } from '../models/User';

const router = Router();

// Public routes
router.use('/auth', authRoutes);

// Protected routes
router.use('/applications', authenticate, applicationRoutes);
router.use('/interviews', authenticate, interviewRoutes);

// Admin routes
router.use('/admin', authenticate, authorize([UserRole.ADMIN]), adminRoutes);

// Interviewer routes
router.use('/interviewer', authenticate, authorize(['interviewer']), interviewerRoutes);

export default router;