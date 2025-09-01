import { Request, Response, NextFunction } from 'express';
import { AppDataSource } from '../config/database';
import { Interviewer } from '../models/Interviewer';
import { AppError } from '../middlewares/errorHandler';

export const getInterviewers = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const interviewerRepository = AppDataSource.getRepository(Interviewer);
    const interviewers = await interviewerRepository.find({
      order: { name: 'ASC' },
    });

    res.json(interviewers);
  } catch (error) {
    next(error);
  }
};

export const getActiveInterviewers = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const interviewerRepository = AppDataSource.getRepository(Interviewer);
    const interviewers = await interviewerRepository.find({
      where: { isActive: true },
      order: { name: 'ASC' },
    });

    res.json(interviewers);
  } catch (error) {
    next(error);
  }
};

export const createInterviewer = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, email, phone, title, department, expertise } = req.body;
    const interviewerRepository = AppDataSource.getRepository(Interviewer);

    // 检查邮箱是否已存在
    const existingInterviewer = await interviewerRepository.findOne({
      where: { email },
    });

    if (existingInterviewer) {
      throw new AppError('该邮箱已被使用', 400);
    }

    const interviewer = interviewerRepository.create({
      name,
      email,
      phone,
      title,
      department,
      expertise,
      isActive: true,
    });

    await interviewerRepository.save(interviewer);

    res.status(201).json({
      message: 'Interviewer created successfully',
      interviewer,
    });
  } catch (error) {
    next(error);
  }
};

export const updateInterviewer = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { name, email, phone, title, department, expertise, isActive } = req.body;
    const interviewerRepository = AppDataSource.getRepository(Interviewer);

    const interviewer = await interviewerRepository.findOne({ where: { id } });
    if (!interviewer) {
      throw new AppError('Interviewer not found', 404);
    }

    // 检查邮箱冲突（排除自己）
    if (email !== interviewer.email) {
      const existingInterviewer = await interviewerRepository.findOne({
        where: { email },
      });

      if (existingInterviewer) {
        throw new AppError('该邮箱已被使用', 400);
      }
    }

    Object.assign(interviewer, {
      name,
      email,
      phone,
      title,
      department,
      expertise,
      isActive,
    });

    await interviewerRepository.save(interviewer);

    res.json({
      message: 'Interviewer updated successfully',
      interviewer,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteInterviewer = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const interviewerRepository = AppDataSource.getRepository(Interviewer);

    const interviewer = await interviewerRepository.findOne({
      where: { id },
      relations: ['interviews'],
    });

    if (!interviewer) {
      throw new AppError('Interviewer not found', 404);
    }

    // 检查是否有关联的面试
    if (interviewer.interviews && interviewer.interviews.length > 0) {
      throw new AppError('无法删除有面试记录的面试者', 400);
    }

    await interviewerRepository.remove(interviewer);

    res.json({
      message: 'Interviewer deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// 初始化默认面试者
export const initializeDefaultInterviewers = async (): Promise<void> => {
  console.log('开始初始化面试者...');
  
  const interviewerRepository = AppDataSource.getRepository(Interviewer);
  
  const defaultInterviewers = [
    {
      name: '张学长',
      email: 'zhang.senior@mails.cust.edu.cn',
      title: '技术负责人',
      department: '代码书院实验室',
      expertise: '前端开发、算法',
    },
    {
      name: '李导师',
      email: 'li.mentor@mails.cust.edu.cn',
      title: '实验室导师',
      department: '代码书院实验室',
      expertise: '后端开发、系统设计',
    },
  ];

  for (const interviewerData of defaultInterviewers) {
    try {
      const existing = await interviewerRepository.findOne({
        where: { email: interviewerData.email },
      });
      
      if (!existing) {
        const interviewer = interviewerRepository.create(interviewerData);
        await interviewerRepository.save(interviewer);
        console.log(`✅ 面试者初始化完成: ${interviewerData.name}`);
      }
    } catch (error) {
      console.error(`❌ 面试者初始化失败: ${interviewerData.name}`, error);
    }
  }

  console.log('面试者初始化完成');
};