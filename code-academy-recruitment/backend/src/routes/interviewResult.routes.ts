import { Router } from 'express';
import {
  getInterviewResults,
  updateInterviewResult,
  sendBatchResultNotifications,
  sendSingleResultNotification,
  getEmailQueueStatus,
  retryFailedEmails,
} from '../controllers/interviewResult.controller';
import { authenticate, authorize } from '../middlewares/auth';

const router = Router();

// 所有路由都需要认证
router.use(authenticate);

// 获取面试结果列表（管理员和面试官都可以访问）
router.get(
  '/results',
  authorize(['admin', 'interviewer']),
  getInterviewResults
);

// 更新面试结果（管理员和面试官都可以访问）
router.put(
  '/results/:id',
  authorize(['admin', 'interviewer']),
  updateInterviewResult
);

// 发送单个结果通知（仅管理员）
router.post(
  '/results/:id/notify',
  authorize(['admin']),
  sendSingleResultNotification
);

// 批量发送结果通知（仅管理员）
router.post(
  '/results/batch-notify',
  authorize(['admin']),
  sendBatchResultNotifications
);

// 获取邮件队列状态（仅管理员）
router.get(
  '/email-queue/status',
  authorize(['admin']),
  getEmailQueueStatus
);

// 重试失败的邮件（仅管理员）
router.post(
  '/email-queue/retry',
  authorize(['admin']),
  retryFailedEmails
);

export default router;