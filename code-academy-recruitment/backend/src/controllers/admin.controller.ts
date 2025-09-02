import { Request, Response, NextFunction } from 'express';
import { In } from 'typeorm';
import { AppDataSource } from '../config/database';
import { User, UserRole } from '../models/User';
import { Application, ApplicationStatus } from '../models/Application';
import { Interview, InterviewResult } from '../models/Interview';
import { InterviewRoom } from '../models/InterviewRoom';
import { Interviewer } from '../models/Interviewer';
import { AppError } from '../middlewares/errorHandler';
import { sendInterviewNotification as sendInterviewEmail, sendResultNotification as sendResultEmail, sendPasswordResetNotification } from '../utils/email';

export const getDashboardStats = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const applicationRepository = AppDataSource.getRepository(Application);
    const interviewRepository = AppDataSource.getRepository(Interview);
    const userRepository = AppDataSource.getRepository(User);

    const [
      totalApplications,
      pendingApplications,
      scheduledInterviews,
      completedInterviews,
      acceptedApplications,
      totalUsers,
    ] = await Promise.all([
      applicationRepository.count(),
      applicationRepository.count({ where: { status: ApplicationStatus.PENDING } }),
      interviewRepository.count({ where: { isCompleted: false } }),
      interviewRepository.count({ where: { isCompleted: true } }),
      applicationRepository.count({ where: { status: ApplicationStatus.ACCEPTED } }),
      userRepository.count({ where: { role: UserRole.APPLICANT } }),
    ]);

    res.json({
      totalApplications,
      pendingApplications,
      scheduledInterviews,
      completedInterviews,
      acceptedApplications,
      totalUsers,
    });
  } catch (error) {
    next(error);
  }
};

export const getUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userRepository = AppDataSource.getRepository(User);
    const { page = 1, limit = 20, search = '' } = req.query;

    const queryBuilder = userRepository.createQueryBuilder('user');

    if (search) {
      queryBuilder.where(
        'user.name ILIKE :search OR user.email ILIKE :search',
        { search: `%${search}%` }
      );
    }

    const [users, total] = await queryBuilder
      .skip((+page - 1) * +limit)
      .take(+limit)
      .orderBy('user.createdAt', 'DESC')
      .getManyAndCount();

    res.json({
      users: users.map(({ password, ...user }) => user),
      total,
      page: +page,
      totalPages: Math.ceil(total / +limit),
    });
  } catch (error) {
    next(error);
  }
};

export const getUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const userRepository = AppDataSource.getRepository(User);

    const user = await userRepository.findOne({
      where: { id },
      relations: ['applications', 'applications.interview'],
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    const { password, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error) {
    next(error);
  }
};

export const getApplications = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const applicationRepository = AppDataSource.getRepository(Application);
    const { page = 1, limit = 20, status, search = '' } = req.query;

    const queryBuilder = applicationRepository
      .createQueryBuilder('application')
      .leftJoinAndSelect('application.user', 'user')
      .leftJoinAndSelect('application.interview', 'interview');

    if (status) {
      queryBuilder.where('application.status = :status', { status });
    }

    if (search) {
      queryBuilder.andWhere(
        '(user.name ILIKE :search OR user.email ILIKE :search OR application.studentId ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    const [applications, total] = await queryBuilder
      .skip((+page - 1) * +limit)
      .take(+limit)
      .orderBy('application.createdAt', 'DESC')
      .getManyAndCount();

    res.json({
      applications,
      total,
      page: +page,
      totalPages: Math.ceil(total / +limit),
    });
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
    const applicationRepository = AppDataSource.getRepository(Application);

    const application = await applicationRepository.findOne({
      where: { id },
      relations: ['user', 'interview', 'interview.room'],
    });

    if (!application) {
      throw new AppError('Application not found', 404);
    }

    res.json(application);
  } catch (error) {
    next(error);
  }
};

export const updateApplicationStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { status, reviewNotes } = req.body;
    const applicationRepository = AppDataSource.getRepository(Application);

    const application = await applicationRepository.findOne({
      where: { id },
    });

    if (!application) {
      throw new AppError('Application not found', 404);
    }

    application.status = status;
    if (reviewNotes) {
      application.reviewNotes = reviewNotes;
    }

    await applicationRepository.save(application);

    res.json({
      message: 'Application status updated',
      application,
    });
  } catch (error) {
    next(error);
  }
};

export const getRooms = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const roomRepository = AppDataSource.getRepository(InterviewRoom);
    const rooms = await roomRepository.find({
      relations: ['interviewers'],
      order: { name: 'ASC' },
    });

    res.json(rooms);
  } catch (error) {
    next(error);
  }
};

export const createRoom = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    console.log('=== 创建教室请求 ===');
    console.log('请求体:', req.body);
    
    const { name, location, interviewerIds } = req.body;
    console.log('解析参数:', { name, location, interviewerIds });
    
    const roomRepository = AppDataSource.getRepository(InterviewRoom);
    const interviewerRepository = AppDataSource.getRepository(Interviewer);

    const room = roomRepository.create({
      name,
      location,
    });
    console.log('创建教室实体:', room);

    // 如果指定了面试官，则关联
    if (interviewerIds && interviewerIds.length > 0) {
      console.log('查找面试官:', interviewerIds);
      const interviewers = await interviewerRepository.find({
        where: { id: In(interviewerIds) },
      });
      console.log('找到面试官:', interviewers.length, '个');
      room.interviewers = interviewers;
    } else {
      console.log('未指定面试官或面试官列表为空');
    }

    console.log('保存教室...');
    await roomRepository.save(room);
    console.log('教室保存成功');

    // 返回包含面试官信息的房间
    const savedRoom = await roomRepository.findOne({
      where: { id: room.id },
      relations: ['interviewers'],
    });
    console.log('返回教室信息:', savedRoom);

    res.status(201).json({
      message: 'Room created successfully',
      room: savedRoom,
    });
  } catch (error) {
    console.error('创建教室失败:', error);
    next(error);
  }
};

export const updateRoom = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { name, location, interviewerIds } = req.body;
    const roomRepository = AppDataSource.getRepository(InterviewRoom);
    const interviewerRepository = AppDataSource.getRepository(Interviewer);

    const room = await roomRepository.findOne({ 
      where: { id },
      relations: ['interviewers'],
    });
    if (!room) {
      throw new AppError('Room not found', 404);
    }

    // 更新基本信息
    room.name = name;
    room.location = location;

    // 更新面试官分配
    if (interviewerIds !== undefined) {
      if (interviewerIds.length > 0) {
        const interviewers = await interviewerRepository.find({
          where: { id: In(interviewerIds) },
        });
        room.interviewers = interviewers;
      } else {
        room.interviewers = [];
      }
    }

    await roomRepository.save(room);

    // 返回包含面试官信息的房间
    const updatedRoom = await roomRepository.findOne({
      where: { id },
      relations: ['interviewers'],
    });

    res.json({
      message: 'Room updated successfully',
      room: updatedRoom,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteRoom = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const roomRepository = AppDataSource.getRepository(InterviewRoom);

    const room = await roomRepository.findOne({
      where: { id },
      relations: ['interviews'],
    });

    if (!room) {
      throw new AppError('Room not found', 404);
    }

    if (room.interviews && room.interviews.length > 0) {
      throw new AppError('Cannot delete room with scheduled interviews', 400);
    }

    await roomRepository.remove(room);

    res.json({
      message: 'Room deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const getInterviews = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const interviewRepository = AppDataSource.getRepository(Interview);
    const { page = 1, limit = 20, date } = req.query;

    const queryBuilder = interviewRepository
      .createQueryBuilder('interview')
      .leftJoinAndSelect('interview.application', 'application')
      .leftJoinAndSelect('interview.room', 'room')
      .leftJoinAndSelect('application.user', 'user');

    if (date) {
      const startDate = new Date(date as string);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 1);

      queryBuilder.where(
        'interview.scheduledAt >= :startDate AND interview.scheduledAt < :endDate',
        { startDate, endDate }
      );
    }

    const [interviews, total] = await queryBuilder
      .skip((+page - 1) * +limit)
      .take(+limit)
      .orderBy('interview.scheduledAt', 'ASC')
      .getManyAndCount();

    res.json({
      interviews,
      total,
      page: +page,
      totalPages: Math.ceil(total / +limit),
    });
  } catch (error) {
    next(error);
  }
};

export const getInterview = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const interviewRepository = AppDataSource.getRepository(Interview);

    const interview = await interviewRepository.findOne({
      where: { id },
      relations: [
        'application', 
        'application.user', 
        'room', 
        'room.interviewers',
        'interviewers'
      ],
    });

    if (!interview) {
      throw new AppError('Interview not found', 404);
    }

    res.json(interview);
  } catch (error) {
    next(error);
  }
};

export const scheduleInterview = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { applicationId, roomId, scheduledAt } = req.body;
    const applicationRepository = AppDataSource.getRepository(Application);
    const interviewRepository = AppDataSource.getRepository(Interview);
    const roomRepository = AppDataSource.getRepository(InterviewRoom);

    const application = await applicationRepository.findOne({
      where: { id: applicationId },
      relations: ['interview'],
    });

    if (!application) {
      throw new AppError('Application not found', 404);
    }

    if (application.interview) {
      throw new AppError('Interview already scheduled for this application', 400);
    }

    // 只有审核通过的申请才能安排面试
    if (application.status !== ApplicationStatus.APPROVED) {
      throw new AppError('只有审核通过的申请才能安排面试', 400);
    }

    const room = await roomRepository.findOne({ 
      where: { id: roomId },
      relations: ['interviewers'],
    });
    if (!room) {
      throw new AppError('Room not found', 404);
    }

    // 获取当前活跃年度
    let currentYear = null;
    try {
      const { RecruitmentYearService } = await import('../services/recruitmentYear.service');
      currentYear = await RecruitmentYearService.getCurrentYear();
    } catch (error) {
      console.log('获取当前年度失败:', error);
    }

    const interview = interviewRepository.create({
      application,
      room,
      scheduledAt: new Date(scheduledAt),
      recruitmentYear: currentYear || undefined,
      interviewers: room.interviewers || [], // 自动分配教室的面试官
    });

    await interviewRepository.save(interview);

    application.status = ApplicationStatus.INTERVIEW_SCHEDULED;
    await applicationRepository.save(application);

    res.status(201).json({
      message: 'Interview scheduled successfully',
      interview,
    });
  } catch (error) {
    next(error);
  }
};

export const updateInterview = async (
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
      relations: ['application'],
    });

    if (!interview) {
      throw new AppError('Interview not found', 404);
    }

    Object.assign(interview, req.body);
    await interviewRepository.save(interview);

    // Update application status if interview is completed
    if (interview.isCompleted && interview.application) {
      interview.application.status = ApplicationStatus.INTERVIEWED;
      await applicationRepository.save(interview.application);
    }

    res.json({
      message: 'Interview updated successfully',
      interview,
    });
  } catch (error) {
    next(error);
  }
};

export const sendInterviewNotification = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const interviewRepository = AppDataSource.getRepository(Interview);

    const interview = await interviewRepository.findOne({
      where: { id },
      relations: ['application', 'application.user', 'room'],
    });

    if (!interview) {
      throw new AppError('Interview not found', 404);
    }

    if (!interview.application) {
      throw new AppError('Interview application not found', 400);
    }

    if (!interview.application.user) {
      throw new AppError('Interview application user not found', 400);
    }

    if (!interview.room) {
      throw new AppError('Interview room not found', 400);
    }

    await sendInterviewEmail(
      interview.application.user.email,
      interview.application.user.name,
      interview.scheduledAt,
      interview.room.name,
      interview.room.location
    );

    interview.notificationSent = true;
    await interviewRepository.save(interview);

    res.json({
      message: 'Interview notification sent successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const sendResultNotification = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { accepted, feedback } = req.body;
    const applicationRepository = AppDataSource.getRepository(Application);

    const application = await applicationRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!application) {
      throw new AppError('Application not found', 404);
    }

    await sendResultEmail(
      application.user.email,
      application.user.name,
      accepted,
      feedback
    );

    application.status = accepted ? ApplicationStatus.ACCEPTED : ApplicationStatus.REJECTED;
    await applicationRepository.save(application);

    res.json({
      message: 'Result notification sent successfully',
    });
  } catch (error) {
    next(error);
  }
};

// User management functions
export const updateUserStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;
    const userRepository = AppDataSource.getRepository(User);

    const user = await userRepository.findOne({ where: { id } });
    if (!user) {
      throw new AppError('User not found', 404);
    }

    // 不能禁用管理员账户
    if (user.role === UserRole.ADMIN) {
      throw new AppError('Cannot disable admin user', 400);
    }

    // 更新用户状态
    user.isActive = isActive;
    await userRepository.save(user);

    res.json({
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const userRepository = AppDataSource.getRepository(User);

    const user = await userRepository.findOne({ 
      where: { id },
      relations: ['applications']
    });
    
    if (!user) {
      throw new AppError('User not found', 404);
    }

    // 不能删除管理员账户
    if (user.role === UserRole.ADMIN) {
      throw new AppError('Cannot delete admin user', 400);
    }

    // 检查用户是否有申请记录
    if (user.applications && user.applications.length > 0) {
      throw new AppError('Cannot delete user with existing applications', 400);
    }

    await userRepository.remove(user);

    res.json({
      message: 'User deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const resetUserPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const userRepository = AppDataSource.getRepository(User);

    const user = await userRepository.findOne({ where: { id } });
    if (!user) {
      throw new AppError('User not found', 404);
    }

    // 生成新密码
    const newPassword = Math.random().toString(36).slice(-8);
    console.log('=== 重置密码 ===');
    console.log('用户:', user.email);
    console.log('新密码（明文）:', newPassword);
    
    user.password = newPassword; // @BeforeUpdate hook will hash it

    await userRepository.save(user);
    console.log('密码重置完成，已保存到数据库');

    // 发送新密码到用户邮箱
    try {
      await sendPasswordResetNotification(user.email, user.name, newPassword);
      console.log(`Password reset email sent to ${user.email}`);
    } catch (emailError) {
      console.error('Failed to send password reset email:', emailError);
      // 即使邮件发送失败，密码重置仍然成功
    }

    res.json({
      message: 'Password reset successfully',
      newPassword, // 临时返回新密码，生产环境中可以移除
    });
  } catch (error) {
    next(error);
  }
};

// Interview evaluation
export const updateInterviewEvaluation = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { evaluationScores, interviewerNotes, result, isCompleted } = req.body;
    const interviewRepository = AppDataSource.getRepository(Interview);

    const interview = await interviewRepository.findOne({
      where: { id },
      relations: ['application', 'application.user'],
    });

    if (!interview) {
      throw new AppError('Interview not found', 404);
    }

    interview.evaluationScores = evaluationScores;
    interview.interviewerNotes = interviewerNotes;
    interview.result = result;
    interview.isCompleted = isCompleted;

    await interviewRepository.save(interview);

    // 同步更新申请状态
    if (isCompleted && interview.application) {
      const applicationRepository = AppDataSource.getRepository(Application);
      
      // 重新获取申请对象，确保数据最新
      const application = await applicationRepository.findOne({
        where: { id: interview.application.id },
      });
      
      if (application) {
        // 根据面试结果更新申请状态
        if (result === 'passed') {
          application.status = ApplicationStatus.ACCEPTED;
        } else if (result === 'failed') {
          application.status = ApplicationStatus.REJECTED;
        } else {
          // 面试完成但结果待定
          application.status = ApplicationStatus.INTERVIEWED;
        }
        
        await applicationRepository.save(application);
        console.log(`申请状态已同步更新: ${interview.application.id} -> ${application.status}`);
      }
    }

    res.json({
      message: 'Interview evaluation saved successfully',
      interview,
    });
  } catch (error) {
    next(error);
  }
};

// Batch interview scheduling
export const createBatchInterviews = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { interviews } = req.body;
    const interviewRepository = AppDataSource.getRepository(Interview);
    const applicationRepository = AppDataSource.getRepository(Application);

    if (!interviews || !Array.isArray(interviews) || interviews.length === 0) {
      throw new AppError('Invalid interviews data', 400);
    }

    console.log('=== 批量创建面试 ===');
    console.log('面试数据:', interviews);

    // 获取当前活跃年度
    let currentYear = null;
    try {
      const { RecruitmentYearService } = await import('../services/recruitmentYear.service');
      currentYear = await RecruitmentYearService.getCurrentYear();
      console.log('批量面试关联年度:', currentYear?.year, currentYear?.name);
    } catch (error) {
      console.log('获取当前年度失败:', error);
    }

    const createdInterviews = [];

    for (const interviewData of interviews) {
      const { applicationId, roomId, scheduledAt } = interviewData;

      // 检查申请是否存在且状态正确
      const application = await applicationRepository.findOne({
        where: { id: applicationId },
        relations: ['user'],
      });

      if (!application) {
        console.error(`Application not found: ${applicationId}`);
        continue;
      }

      // 只有审核通过的申请才能安排面试
      if (application.status !== ApplicationStatus.APPROVED) {
        console.error(`Application ${applicationId} status is ${application.status}, expected approved`);
        continue;
      }

      // 检查是否已有面试安排
      const existingInterview = await interviewRepository.findOne({
        where: { application: { id: applicationId } },
      });

      if (existingInterview) {
        console.error(`Interview already exists for application ${applicationId}`);
        continue;
      }

      // 获取房间和面试官信息
      const roomRepository = AppDataSource.getRepository(InterviewRoom);
      const room = await roomRepository.findOne({
        where: { id: roomId },
        relations: ['interviewers'],
      });

      if (!room) {
        console.error(`Room not found: ${roomId}`);
        continue;
      }

      // 创建面试记录
      const interview = interviewRepository.create({
        application: { id: applicationId },
        room: { id: roomId },
        scheduledAt: new Date(scheduledAt),
        result: InterviewResult.PENDING,
        isCompleted: false,
        notificationSent: false,
        recruitmentYear: currentYear || undefined,
        interviewers: room.interviewers || [], // 分配教室的面试官
      });

      const savedInterview = await interviewRepository.save(interview);
      createdInterviews.push(savedInterview);

      // 更新申请状态
      application.status = ApplicationStatus.INTERVIEW_SCHEDULED;
      await applicationRepository.save(application);
    }

    console.log(`成功创建 ${createdInterviews.length} 个面试`);

    res.json({
      message: `Successfully scheduled ${createdInterviews.length} interviews`,
      interviews: createdInterviews,
    });
  } catch (error) {
    next(error);
  }
};