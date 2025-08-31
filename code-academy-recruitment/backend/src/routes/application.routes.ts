import { Router } from 'express';
import { body } from 'express-validator';
import { validateRequest } from '../middlewares/validation';
import { uploadApplicationFiles } from '../middlewares/upload';
import { authenticate } from '../middlewares/auth';
import * as applicationController from '../controllers/application.controller';
import { ConfigService } from '../services/config.service';

const router = Router();

// Get application config
router.get('/config', async (_req, res, next) => {
  try {
    console.log('=== 获取申请配置 ===');
    
    const freshmanEnabled = await ConfigService.get('recruitment.freshman.enabled', 'true');
    const sophomoreEnabled = await ConfigService.get('recruitment.sophomore.enabled', 'true');
    const deadline = await ConfigService.get('recruitment.application.deadline');
    const startTime = await ConfigService.get('recruitment.application.start_time');

    console.log('从数据库读取的配置:');
    console.log('freshman.enabled (原始值):', freshmanEnabled);
    console.log('sophomore.enabled (原始值):', sophomoreEnabled);
    console.log('deadline:', deadline);
    console.log('startTime:', startTime);

    const responseData = {
      freshmanEnabled: freshmanEnabled === 'true',
      sophomoreEnabled: sophomoreEnabled === 'true',
      deadline,
      startTime,
      allowedGrades: ['大一', '大二'],
    };

    console.log('返回给前端的配置:');
    console.log('freshmanEnabled (布尔值):', responseData.freshmanEnabled);
    console.log('sophomoreEnabled (布尔值):', responseData.sophomoreEnabled);

    res.json(responseData);
  } catch (error) {
    console.error('获取申请配置失败:', error);
    next(error);
  }
});

// Get user's applications (需要认证)
router.get('/my', authenticate, applicationController.getMyApplications);

// Get single application (需要认证)
router.get('/:id', authenticate, applicationController.getApplication);

// Create application (需要认证)
router.post(
  '/',
  authenticate,
  uploadApplicationFiles,
  [
    body('studentId').notEmpty().withMessage('学号不能为空'),
    body('phone').isMobilePhone('zh-CN').withMessage('请输入有效的手机号'),
    body('major').notEmpty().withMessage('专业不能为空'),
    body('grade').isIn(['大一', '大二']).withMessage('只接受大一、大二学生申请'),
    body('introduction')
      .isLength({ min: 50 })
      .withMessage('自我介绍至少需要50个字符'),
    body('skills').notEmpty().withMessage('技能特长不能为空'),
    body('experience').notEmpty().withMessage('项目经验不能为空'),
    body('motivation')
      .isLength({ min: 50 })
      .withMessage('加入动机至少需要50个字符'),
    // 年级特定信息验证
    body('gradeSpecificInfo').optional().isObject(),
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