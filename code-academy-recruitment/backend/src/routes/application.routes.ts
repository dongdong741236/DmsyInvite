import { Router } from 'express';
import { body } from 'express-validator';
import { validateRequest } from '../middlewares/validation';
import * as applicationController from '../controllers/application.controller';

const router = Router();

// Get user's applications
router.get('/my', applicationController.getMyApplications);

// Get single application
router.get('/:id', applicationController.getApplication);

// Create application
router.post(
  '/',
  [
    body('studentId').notEmpty().withMessage('Student ID is required'),
    body('phone').isMobilePhone('zh-CN').withMessage('Invalid phone number'),
    body('major').notEmpty().withMessage('Major is required'),
    body('grade').notEmpty().withMessage('Grade is required'),
    body('introduction')
      .isLength({ min: 50 })
      .withMessage('Introduction must be at least 50 characters'),
    body('skills').notEmpty().withMessage('Skills are required'),
    body('experience').notEmpty().withMessage('Experience is required'),
    body('motivation')
      .isLength({ min: 50 })
      .withMessage('Motivation must be at least 50 characters'),
  ],
  validateRequest,
  applicationController.createApplication
);

// Update application (only if status is pending)
router.put(
  '/:id',
  [
    body('studentId').optional().notEmpty(),
    body('phone').optional().isMobilePhone('zh-CN'),
    body('major').optional().notEmpty(),
    body('grade').optional().notEmpty(),
    body('introduction').optional().isLength({ min: 50 }),
    body('skills').optional().notEmpty(),
    body('experience').optional().notEmpty(),
    body('motivation').optional().isLength({ min: 50 }),
  ],
  validateRequest,
  applicationController.updateApplication
);

export default router;