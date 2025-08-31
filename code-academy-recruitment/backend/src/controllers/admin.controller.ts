import { Request, Response, NextFunction } from 'express';
import { AppDataSource } from '../config/database';
import { User, UserRole } from '../models/User';
import { Application, ApplicationStatus } from '../models/Application';
import { Interview } from '../models/Interview';
import { InterviewRoom } from '../models/InterviewRoom';
import { AppError } from '../middlewares/errorHandler';
import { sendInterviewNotification as sendInterviewEmail, sendResultNotification as sendResultEmail } from '../utils/email';

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
    const roomRepository = AppDataSource.getRepository(InterviewRoom);
    const room = roomRepository.create(req.body);
    await roomRepository.save(room);

    res.status(201).json({
      message: 'Room created successfully',
      room,
    });
  } catch (error) {
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
    const roomRepository = AppDataSource.getRepository(InterviewRoom);

    const room = await roomRepository.findOne({ where: { id } });
    if (!room) {
      throw new AppError('Room not found', 404);
    }

    Object.assign(room, req.body);
    await roomRepository.save(room);

    res.json({
      message: 'Room updated successfully',
      room,
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

    const room = await roomRepository.findOne({ where: { id: roomId } });
    if (!room) {
      throw new AppError('Room not found', 404);
    }

    const interview = interviewRepository.create({
      application,
      room,
      scheduledAt: new Date(scheduledAt),
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