import { Request, Response, NextFunction } from 'express';
import { AppDataSource } from '../config/database';
import { Application, ApplicationStatus } from '../models/Application';
import { AppError } from '../middlewares/errorHandler';
import { ConfigService } from '../services/config.service';

export const getMyApplications = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.id;
    const applicationRepository = AppDataSource.getRepository(Application);

    const applications = await applicationRepository.find({
      where: { user: { id: userId } },
      relations: ['interview', 'interview.room'],
      order: { createdAt: 'DESC' },
    });

    res.json(applications);
  } catch (error) {
    next(error);
  }
};

export const getApplication = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const applicationRepository = AppDataSource.getRepository(Application);

    const application = await applicationRepository.findOne({
      where: { id, user: { id: userId } },
      relations: ['interview', 'interview.room'],
    });

    if (!application) {
      throw new AppError('Application not found', 404);
    }

    res.json(application);
  } catch (error) {
    next(error);
  }
};

export const createApplication = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.id;
    const user = req.user!;
    const applicationRepository = AppDataSource.getRepository(Application);

    // 禁止管理员提交申请
    if (user.role === 'admin') {
      throw new AppError('管理员不能提交申请', 403);
    }

    // 检查申请是否开放
    const { open, reason } = await ConfigService.isApplicationOpen(req.body.grade);
    if (!open) {
      throw new AppError(reason || '申请暂不开放', 400);
    }

    // 检查用户是否已有申请
    const maxApplications = parseInt(await ConfigService.get('recruitment.max_applications_per_user', '1'));
    const existingApplicationsCount = await applicationRepository.count({
      where: { user: { id: userId } },
    });

    if (existingApplicationsCount >= maxApplications) {
      throw new AppError(`您已达到最大申请数量限制（${maxApplications}个）`, 400);
    }

    // 处理申请数据（文件路径已通过单独接口上传）
    const applicationData: any = { ...req.body };
    
    console.log('=== 创建申请 ===');
    console.log('接收到的数据:', applicationData);

    // 获取当前活跃年度
    try {
      const { RecruitmentYearService } = await import('../services/recruitmentYear.service');
      const currentYear = await RecruitmentYearService.getCurrentYear();
      if (currentYear) {
        applicationData.recruitmentYear = { id: currentYear.id };
        console.log('申请关联到年度:', currentYear.year, currentYear.name);
      }
    } catch (error) {
      console.log('获取当前年度失败，申请将不关联年度:', error);
    }

    // 大二学生特殊验证
    if (applicationData.grade === '大二') {
      const sophomoreInfo = applicationData.gradeSpecificInfo?.sophomoreInfo;
      
      // C/C++成绩是必填的
      if (!sophomoreInfo?.programmingGrade || sophomoreInfo.programmingGrade === '未修读') {
        throw new AppError('大二学生必须提供C/C++编程课程成绩', 400);
      }
      
      // 如果选择了转专业，必须填写原专业
      if (sophomoreInfo?.isTransferStudent === 'true' && !sophomoreInfo?.originalMajor) {
        throw new AppError('转专业学生必须填写原专业信息', 400);
      }
    }

    const application = applicationRepository.create({
      ...applicationData,
      user: { id: userId },
    });

    await applicationRepository.save(application);

    res.status(201).json({
      message: '申请提交成功',
      application,
    });
  } catch (error) {
    next(error);
  }
};

export const updateApplication = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const applicationRepository = AppDataSource.getRepository(Application);

    const application = await applicationRepository.findOne({
      where: { id, user: { id: userId } },
    });

    if (!application) {
      throw new AppError('Application not found', 404);
    }

    if (application.status !== ApplicationStatus.PENDING) {
      throw new AppError('Cannot update application after review has started', 400);
    }

    Object.assign(application, req.body);
    await applicationRepository.save(application);

    res.json({
      message: 'Application updated successfully',
      application,
    });
  } catch (error) {
    next(error);
  }
};

// 获取用户的面试安排
export const getMyInterviewSchedule = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.id;
    const applicationRepository = AppDataSource.getRepository(Application);

    const applications = await applicationRepository.find({
      where: { user: { id: userId } },
      relations: ['interview', 'interview.room'],
    });

    // 过滤出有面试安排的申请
    const interviewSchedules = applications
      .filter(app => app.interview)
      .map(app => ({
        applicationId: app.id,
        interviewId: app.interview!.id,
        scheduledAt: app.interview!.scheduledAt,
        room: {
          name: app.interview!.room?.name,
          location: app.interview!.room?.location,
        },
        status: app.status,
        isCompleted: app.interview!.isCompleted,
        result: app.interview!.result,
        notificationSent: app.interview!.notificationSent,
      }));

    res.json(interviewSchedules);
  } catch (error) {
    next(error);
  }
};