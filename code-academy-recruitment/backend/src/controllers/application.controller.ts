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
    const applicationRepository = AppDataSource.getRepository(Application);
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };

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

    // 处理文件上传和数据解析
    const applicationData: any = { ...req.body };
    
    // 解析 JSON 字符串字段
    if (typeof applicationData.gradeSpecificInfo === 'string') {
      try {
        applicationData.gradeSpecificInfo = JSON.parse(applicationData.gradeSpecificInfo);
      } catch (error) {
        console.error('Failed to parse gradeSpecificInfo:', error);
      }
    }

    // 大二学生特殊验证（在数据解析后）
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
    
    if (files) {
      if (files.personalPhoto && files.personalPhoto[0]) {
        // 只存储相对路径
        applicationData.personalPhoto = files.personalPhoto[0].path.replace(/^uploads\//, '');
      }
      if (files.studentCardPhoto && files.studentCardPhoto[0]) {
        applicationData.studentCardPhoto = files.studentCardPhoto[0].path.replace(/^uploads\//, '');
      }
      if (files.experienceAttachment && files.experienceAttachment[0]) {
        applicationData.experienceAttachment = files.experienceAttachment[0].path.replace(/^uploads\//, '');
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