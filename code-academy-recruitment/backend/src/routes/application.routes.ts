import { Router } from 'express';
import { body } from 'express-validator';
import { validateRequest } from '../middlewares/validation';
import { uploadApplicationFiles } from '../middlewares/upload';
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

// Get user's applications
router.get('/my', applicationController.getMyApplications);

// Get single application
router.get('/:id', applicationController.getApplication);

// Upload files
router.post('/upload', uploadApplicationFiles, async (req, res) => {
  try {
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    const uploadedFiles: { [key: string]: string | string[] } = {};

    console.log('=== 文件上传调试 ===');
    console.log('接收到的文件字段:', Object.keys(files || {}));

    if (files) {
      Object.keys(files).forEach((fieldname) => {
        if (files[fieldname] && files[fieldname].length > 0) {
          console.log(`字段 ${fieldname} 的文件信息:`);
          files[fieldname].forEach((file, index) => {
            console.log(`  文件${index + 1}:`);
            console.log(`    原始名称: ${file.originalname}`);
            console.log(`    存储名称: ${file.filename}`);
            console.log(`    完整路径: ${file.path}`);
            console.log(`    目标目录: ${file.destination}`);
          });
          if (fieldname === 'experienceAttachments') {
            // 多文件字段，返回数组
            uploadedFiles[fieldname] = files[fieldname].map(file => {
              // 使用目标目录和文件名构建相对路径
              const subDir = 'attachments';
              const relativePath = `${subDir}/${file.filename}`;
              
              console.log('多文件路径处理:', file.path, '->', relativePath);
              return relativePath;
            });
          } else {
            // 单文件字段，返回字符串
            const file = files[fieldname][0];
            if (file) {
              // 根据字段名确定子目录
              let subDir = 'others';
              if (file.fieldname === 'personalPhoto') {
                subDir = 'photos/personal';
              } else if (file.fieldname === 'studentCardPhoto') {
                subDir = 'photos/student-cards';
              }
              
              const relativePath = `${subDir}/${file.filename}`;
              
              console.log('单文件路径处理:', file.path, '->', relativePath);
              uploadedFiles[fieldname] = relativePath;
            }
          }
        }
      });
    }

    res.json({ files: uploadedFiles });
  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({ error: '文件上传失败' });
  }
});

// Create application
router.post(
  '/',
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