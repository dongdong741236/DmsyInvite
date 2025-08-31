import { Router } from 'express';
import { body } from 'express-validator';
import { validateRequest } from '../middlewares/validation';
import * as adminController from '../controllers/admin.controller';
import * as configController from '../controllers/config.controller';

const router = Router();

// Dashboard stats
router.get('/stats', adminController.getDashboardStats);

// User management
router.get('/users', adminController.getUsers);
router.get('/users/:id', adminController.getUser);

// Application management
router.get('/applications', adminController.getApplications);
router.get('/applications/:id', adminController.getApplication);
router.put(
  '/applications/:id/status',
  [
    body('status').isIn(['pending', 'reviewing', 'interview_scheduled', 'interviewed', 'accepted', 'rejected']),
    body('reviewNotes').optional().isString(),
  ],
  validateRequest,
  adminController.updateApplicationStatus
);

// Interview room management
router.get('/rooms', adminController.getRooms);
router.post(
  '/rooms',
  [
    body('name').notEmpty(),
    body('location').notEmpty(),
    body('capacity').isInt({ min: 1 }),
  ],
  validateRequest,
  adminController.createRoom
);
router.put('/rooms/:id', adminController.updateRoom);
router.delete('/rooms/:id', adminController.deleteRoom);

// Interview management
router.get('/interviews', adminController.getInterviews);
router.post(
  '/interviews',
  [
    body('applicationId').isUUID(),
    body('roomId').isUUID(),
    body('scheduledAt').isISO8601(),
  ],
  validateRequest,
  adminController.scheduleInterview
);
router.put(
  '/interviews/:id',
  [
    body('interviewerNotes').optional().isString(),
    body('evaluationScores').optional().isObject(),
    body('result').optional().isIn(['passed', 'failed', 'pending']),
    body('isCompleted').optional().isBoolean(),
  ],
  validateRequest,
  adminController.updateInterview
);

// Send notifications
router.post(
  '/interviews/:id/notify',
  adminController.sendInterviewNotification
);
router.post(
  '/applications/:id/notify-result',
  [
    body('accepted').isBoolean(),
    body('feedback').optional().isString(),
  ],
  validateRequest,
  adminController.sendResultNotification
);

// System configuration management
router.get('/configs', configController.getConfigs);
router.put('/configs/:key', 
  [
    body('value').notEmpty().withMessage('配置值不能为空'),
    body('description').optional().isString(),
  ],
  validateRequest,
  configController.updateConfig
);
router.put('/configs', 
  [
    body('configs').isArray().withMessage('配置数据必须是数组'),
  ],
  validateRequest,
  configController.updateConfigs
);
router.get('/recruitment-status', configController.getRecruitmentStatus);

export default router;