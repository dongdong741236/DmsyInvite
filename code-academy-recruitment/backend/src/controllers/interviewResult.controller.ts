import { Request, Response, NextFunction } from 'express';
import { AppDataSource } from '../config/database';
import { Interview } from '../models/Interview';
import { Application, ApplicationStatus } from '../models/Application';
import { Interviewer } from '../models/Interviewer';
import { emailQueueService } from '../services/emailQueue.service';

class AppError extends Error {
  statusCode: number;
  
  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'AppError';
  }
}

/**
 * 获取面试结果列表（管理员看所有，面试官看自己的）
 */
export const getInterviewResults = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { page = 1, limit = 20, status, result } = req.query;
    const user = req.user;
    
    const interviewRepository = AppDataSource.getRepository(Interview);
    
    let queryBuilder = interviewRepository
      .createQueryBuilder('interview')
      .leftJoinAndSelect('interview.application', 'application')
      .leftJoinAndSelect('application.user', 'user')
      .leftJoinAndSelect('interview.room', 'room')
      .leftJoinAndSelect('interview.interviewers', 'interviewers')
      .where('interview.isCompleted = :isCompleted', { isCompleted: true })
      .orderBy('interview.updatedAt', 'DESC');

    // 如果是面试官，只显示自己参与的面试
    if (user?.role === 'interviewer') {
      const interviewer = await AppDataSource.getRepository(Interviewer).findOne({
        where: { email: user.email }
      });
      
      if (interviewer) {
        queryBuilder = queryBuilder
          .andWhere('interviewers.id = :interviewerId', { interviewerId: interviewer.id });
      }
    }

    // 过滤条件
    if (status === 'notified') {
      queryBuilder = queryBuilder.andWhere('interview.notificationSent = :sent', { sent: true });
    } else if (status === 'pending') {
      queryBuilder = queryBuilder.andWhere('interview.notificationSent = :sent', { sent: false });
    }

    if (result) {
      queryBuilder = queryBuilder.andWhere('interview.result = :result', { result });
    }

    // 分页
    const skip = (Number(page) - 1) * Number(limit);
    queryBuilder = queryBuilder.skip(skip).take(Number(limit));

    const [interviews, total] = await queryBuilder.getManyAndCount();

    // 格式化返回数据
    const formattedResults = interviews.map(interview => ({
      id: interview.id,
      applicationId: interview.application?.id,
      applicant: {
        name: interview.application?.user?.name || '未知',
        email: interview.application?.user?.email || '未知',
        studentId: interview.application?.studentId,
        major: interview.application?.major,
        grade: interview.application?.grade,
      },
      interviewDate: interview.scheduledAt,
      room: {
        name: interview.room?.name,
        location: interview.room?.location,
      },
      evaluationScores: interview.evaluationScores || {},
      interviewerNotes: interview.interviewerNotes,
      questionAnswers: interview.questionAnswers,
      result: interview.result,
      notificationSent: interview.notificationSent,
      interviewers: interview.interviewers?.map(i => ({
        id: i.id,
        name: i.name,
        title: i.title,
      })),
      updatedAt: interview.updatedAt,
    }));

    res.json({
      results: formattedResults,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 更新面试评分和结果
 */
export const updateInterviewResult = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { evaluationScores, interviewerNotes, result, questionAnswers } = req.body;
    const user = req.user;

    const interviewRepository = AppDataSource.getRepository(Interview);
    const interview = await interviewRepository.findOne({
      where: { id },
      relations: ['application', 'interviewers'],
    });

    if (!interview) {
      throw new AppError('Interview not found', 404);
    }

    // 权限检查：管理员可以修改所有，面试官只能修改自己参与的
    if (user?.role === 'interviewer') {
      const interviewer = await AppDataSource.getRepository(Interviewer).findOne({
        where: { email: user.email }
      });
      
      const isParticipant = interview.interviewers?.some(i => i.id === interviewer?.id);
      if (!isParticipant) {
        throw new AppError('You are not authorized to update this interview', 403);
      }
    }

    // 更新面试信息
    if (evaluationScores !== undefined) {
      interview.evaluationScores = evaluationScores;
    }
    if (interviewerNotes !== undefined) {
      interview.interviewerNotes = interviewerNotes;
    }
    if (result !== undefined) {
      interview.result = result;
    }
    if (questionAnswers !== undefined) {
      interview.questionAnswers = questionAnswers;
    }

    // 如果还没标记为完成，现在标记
    if (!interview.isCompleted) {
      interview.isCompleted = true;
    }

    await interviewRepository.save(interview);

    res.json({
      message: 'Interview result updated successfully',
      interview: {
        id: interview.id,
        evaluationScores: interview.evaluationScores,
        interviewerNotes: interview.interviewerNotes,
        result: interview.result,
        questionAnswers: interview.questionAnswers,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 批量发送结果通知（仅管理员）
 */
export const sendBatchResultNotifications = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { interviewIds } = req.body;

    if (!Array.isArray(interviewIds) || interviewIds.length === 0) {
      throw new AppError('Please provide interview IDs', 400);
    }

    const interviewRepository = AppDataSource.getRepository(Interview);
    const applicationRepository = AppDataSource.getRepository(Application);

    const interviews = await interviewRepository.find({
      where: interviewIds.map(id => ({ id })),
      relations: ['application', 'application.user'],
    });

    if (interviews.length === 0) {
      throw new AppError('No interviews found', 404);
    }

    const emailTasks = [];
    const updatedInterviews = [];

    for (const interview of interviews) {
      // 跳过已发送通知的
      if (interview.notificationSent) {
        continue;
      }

      // 确保有结果
      if (!interview.result || interview.result === 'pending') {
        continue;
      }

      // 确保有申请人信息
      if (!interview.application?.user) {
        console.error(`Interview ${interview.id} has no associated user`);
        continue;
      }

      // 添加到邮件队列
      emailTasks.push({
        email: interview.application.user.email,
        name: interview.application.user.name,
        result: interview.result,
        interviewId: interview.id,
        applicationId: interview.application.id,
      });

      // 标记为已发送
      interview.notificationSent = true;
      updatedInterviews.push(interview);

      // 更新申请状态
      if (interview.application) {
        interview.application.status = 
          interview.result === 'passed' 
            ? ApplicationStatus.ACCEPTED 
            : ApplicationStatus.REJECTED;
      }
    }

    // 批量添加到邮件队列
    const taskIds = emailQueueService.addBatchToQueue(emailTasks);

    // 保存更新
    if (updatedInterviews.length > 0) {
      await interviewRepository.save(updatedInterviews);
      
      // 保存申请状态更新
      const applications = updatedInterviews
        .map(i => i.application)
        .filter(a => a !== null) as Application[];
      
      if (applications.length > 0) {
        await applicationRepository.save(applications);
      }
    }

    const queueStatus = emailQueueService.getQueueStatus();

    res.json({
      message: `Successfully queued ${emailTasks.length} email notifications`,
      queued: emailTasks.length,
      skipped: interviewIds.length - emailTasks.length,
      taskIds,
      queueStatus,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 发送单个结果通知
 */
export const sendSingleResultNotification = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const interviewRepository = AppDataSource.getRepository(Interview);
    const applicationRepository = AppDataSource.getRepository(Application);

    const interview = await interviewRepository.findOne({
      where: { id },
      relations: ['application', 'application.user'],
    });

    if (!interview) {
      throw new AppError('Interview not found', 404);
    }

    if (interview.notificationSent) {
      throw new AppError('Notification already sent', 400);
    }

    if (!interview.result || interview.result === 'pending') {
      throw new AppError('Interview result not set', 400);
    }

    if (!interview.application?.user) {
      throw new AppError('No user associated with this interview', 400);
    }

    // 添加到邮件队列
    const taskId = emailQueueService.addToQueue({
      email: interview.application.user.email,
      name: interview.application.user.name,
      result: interview.result,
      interviewId: interview.id,
      applicationId: interview.application.id,
    });

    // 标记为已发送
    interview.notificationSent = true;
    await interviewRepository.save(interview);

    // 更新申请状态
    if (interview.application) {
      interview.application.status = 
        interview.result === 'passed' 
          ? ApplicationStatus.ACCEPTED 
          : ApplicationStatus.REJECTED;
      await applicationRepository.save(interview.application);
    }

    res.json({
      message: 'Result notification queued successfully',
      taskId,
      queueStatus: emailQueueService.getQueueStatus(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 获取邮件队列状态
 */
export const getEmailQueueStatus = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const status = emailQueueService.getQueueStatus();
    const tasks = emailQueueService.getQueueTasks();

    res.json({
      status,
      tasks: tasks.slice(0, 50), // 只返回前50个任务
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 重试失败的邮件任务
 */
export const retryFailedEmails = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const count = emailQueueService.retryFailedTasks();

    res.json({
      message: `Retrying ${count} failed email tasks`,
      count,
      queueStatus: emailQueueService.getQueueStatus(),
    });
  } catch (error) {
    next(error);
  }
};