import { Router } from 'express';
import { body } from 'express-validator';
import { validateRequest } from '../middlewares/validation';
import * as adminController from '../controllers/admin.controller';
import * as configController from '../controllers/config.controller';
import * as emailTemplateController from '../controllers/emailTemplate.controller';
import * as interviewQuestionController from '../controllers/interviewQuestion.controller';

const router = Router();

// Dashboard stats
router.get('/stats', adminController.getDashboardStats);

// User management
router.get('/users', adminController.getUsers);
router.get('/users/:id', adminController.getUser);
router.put('/users/:id/status', adminController.updateUserStatus);
router.delete('/users/:id', adminController.deleteUser);
router.post('/users/:id/reset-password', adminController.resetUserPassword);

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

// Batch interview scheduling
router.post(
  '/interviews/batch',
  [
    body('interviews').isArray().withMessage('interviews must be an array'),
    body('interviews.*.applicationId').isUUID().withMessage('Invalid application ID'),
    body('interviews.*.roomId').isUUID().withMessage('Invalid room ID'),
    body('interviews.*.scheduledAt').isISO8601().withMessage('Invalid scheduled time'),
  ],
  validateRequest,
  adminController.createBatchInterviews
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

// Interview evaluation
router.put('/interviews/:id/evaluation', adminController.updateInterviewEvaluation);

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

// Email template management
router.get('/email-templates', emailTemplateController.getTemplates);
router.get('/email-templates/:type', emailTemplateController.getTemplate);
router.put('/email-templates/:type', 
  [
    body('name').notEmpty().withMessage('模板名称不能为空'),
    body('subject').notEmpty().withMessage('邮件主题不能为空'),
    body('htmlContent').notEmpty().withMessage('邮件内容不能为空'),
    body('isActive').isBoolean().withMessage('状态必须是布尔值'),
  ],
  validateRequest,
  emailTemplateController.updateTemplate
);
router.post('/email-templates/:type/preview', emailTemplateController.previewTemplate);

// Interview question management
router.get('/interview-questions', interviewQuestionController.getQuestions);
router.get('/interview-questions/all', interviewQuestionController.getAllQuestions);
router.post('/interview-questions', 
  [
    body('question').notEmpty().withMessage('问题内容不能为空'),
    body('category').isIn(['technical', 'behavioral', 'motivation', 'general']).withMessage('无效的问题类别'),
    body('description').optional().isString(),
    body('sortOrder').optional().isInt(),
  ],
  validateRequest,
  interviewQuestionController.createQuestion
);
router.put('/interview-questions/:id', interviewQuestionController.updateQuestion);
router.delete('/interview-questions/:id', interviewQuestionController.deleteQuestion);

export default router;