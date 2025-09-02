import { Router } from 'express';
import { AppDataSource } from '../config/database';
import { Interview } from '../models/Interview';
import { InterviewQuestion } from '../models/InterviewQuestion';
import { Request, Response, NextFunction } from 'express';

const router = Router();

// 获取面试官统计信息
router.get('/stats', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const interviewerId = req.user!.id;
    const interviewRepository = AppDataSource.getRepository(Interview);

    // 查询面试官参与的所有面试
    const interviews = await interviewRepository
      .createQueryBuilder('interview')
      .innerJoin('interview.interviewers', 'interviewer')
      .where('interviewer.id = :interviewerId', { interviewerId })
      .getMany();

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayInterviews = interviews.filter(interview => {
      const scheduledTime = new Date(interview.scheduledAt);
      return scheduledTime >= today && scheduledTime < tomorrow;
    });

    const completedInterviews = interviews.filter(interview => interview.isCompleted);
    const pendingInterviews = interviews.filter(interview => !interview.isCompleted);

    res.json({
      totalInterviews: interviews.length,
      todayInterviews: todayInterviews.length,
      completedInterviews: completedInterviews.length,
      pendingInterviews: pendingInterviews.length,
    });
  } catch (error) {
    next(error);
  }
});

// 获取今日面试安排
router.get('/interviews/today', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const interviewerId = req.user!.id;
    const interviewRepository = AppDataSource.getRepository(Interview);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const interviews = await interviewRepository
      .createQueryBuilder('interview')
      .innerJoinAndSelect('interview.application', 'application')
      .innerJoinAndSelect('application.user', 'user')
      .innerJoinAndSelect('interview.room', 'room')
      .innerJoin('interview.interviewers', 'interviewer')
      .where('interviewer.id = :interviewerId', { interviewerId })
      .andWhere('interview.scheduledAt >= :today', { today })
      .andWhere('interview.scheduledAt < :tomorrow', { tomorrow })
      .orderBy('interview.scheduledAt', 'ASC')
      .getMany();

    res.json(interviews);
  } catch (error) {
    next(error);
  }
});

// 获取面试官的所有面试
router.get('/interviews', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const interviewerId = req.user!.id;
    const interviewRepository = AppDataSource.getRepository(Interview);

    const interviews = await interviewRepository
      .createQueryBuilder('interview')
      .innerJoinAndSelect('interview.application', 'application')
      .innerJoinAndSelect('application.user', 'user')
      .innerJoinAndSelect('interview.room', 'room')
      .innerJoin('interview.interviewers', 'interviewer')
      .where('interviewer.id = :interviewerId', { interviewerId })
      .orderBy('interview.scheduledAt', 'DESC')
      .getMany();

    res.json(interviews);
  } catch (error) {
    next(error);
  }
});

// 获取单个面试详情（只能查看自己参与的面试）
router.get('/interviews/:id', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const interviewerId = req.user!.id;
    const interviewRepository = AppDataSource.getRepository(Interview);

    const interview = await interviewRepository
      .createQueryBuilder('interview')
      .innerJoinAndSelect('interview.application', 'application')
      .innerJoinAndSelect('application.user', 'user')
      .innerJoinAndSelect('interview.room', 'room')
      .leftJoinAndSelect('interview.interviewers', 'interviewers')
      .where('interview.id = :id', { id })
      .getOne();

    if (!interview) {
      res.status(404).json({ error: '面试不存在' });
      return;
    }

    // 检查当前面试官是否参与此面试
    const isParticipant = interview.interviewers?.some(interviewer => interviewer.id === interviewerId);
    if (!isParticipant) {
      res.status(403).json({ error: '无权访问此面试' });
      return;
    }

    res.json(interview);
  } catch (error) {
    next(error);
  }
});

// 更新面试评价（只能更新自己参与的面试）
router.put('/interviews/:id/evaluation', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { evaluationScores, interviewerNotes, result, questionAnswers, isCompleted } = req.body;
    const interviewerId = req.user!.id;
    const interviewRepository = AppDataSource.getRepository(Interview);

    const interview = await interviewRepository
      .createQueryBuilder('interview')
      .innerJoinAndSelect('interview.application', 'application')
      .leftJoinAndSelect('interview.interviewers', 'interviewers')
      .where('interview.id = :id', { id })
      .getOne();

    if (!interview) {
      res.status(404).json({ error: '面试不存在' });
      return;
    }

    // 检查权限
    const isParticipant = interview.interviewers?.some(interviewer => interviewer.id === interviewerId);
    if (!isParticipant) {
      res.status(403).json({ error: '无权修改此面试' });
      return;
    }

    // 更新面试结果
    if (evaluationScores) {
      interview.evaluationScores = evaluationScores;
    }
    if (interviewerNotes) {
      interview.interviewerNotes = interviewerNotes;
    }
    if (result) {
      interview.result = result;
    }
    if (isCompleted !== undefined) {
      interview.isCompleted = isCompleted;
    }
    if (questionAnswers) {
      interview.questionAnswers = questionAnswers;
    }

    await interviewRepository.save(interview);

    // 同步更新申请状态
    if (interview.application) {
      const { Application, ApplicationStatus } = await import('../models/Application');
      const applicationRepository = AppDataSource.getRepository(Application);
      const application = await applicationRepository.findOne({ 
        where: { id: interview.application.id } 
      });
      
      if (application) {
        // 面试完成但不立即更新最终状态，等待通知后再更新
        application.status = ApplicationStatus.INTERVIEWED;
        await applicationRepository.save(application);
      }
    }

    res.json({
      message: '面试评价更新成功',
      interview,
    });
  } catch (error) {
    next(error);
  }
});

// 获取面试题库（只读）
router.get('/questions', async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const questionRepository = AppDataSource.getRepository(InterviewQuestion);
    
    const questions = await questionRepository.find({
      where: { isActive: true },
      order: { category: 'ASC', sortOrder: 'ASC' },
    });

    res.json(questions);
  } catch (error) {
    next(error);
  }
});

export default router;