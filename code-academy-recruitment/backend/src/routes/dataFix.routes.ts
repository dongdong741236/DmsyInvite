import { Router } from 'express';
import {
  checkDataIntegrity,
  fixNotificationFlags,
  fixNullApplicationIds,
} from '../controllers/dataFix.controller';
import { authenticate, authorize } from '../middlewares/auth';

const router = Router();

// 所有路由都需要管理员权限
router.use(authenticate);
router.use(authorize(['admin']));

// 检查数据完整性
router.get('/check', checkDataIntegrity);

// 修复notificationSent标志
router.post('/fix-notification-flags', fixNotificationFlags);

// 修复NULL的applicationId
router.post('/fix-null-application', fixNullApplicationIds);

export default router;