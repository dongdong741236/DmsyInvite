import { Request, Response, NextFunction } from 'express';
import { AppDataSource } from '../config/database';
import { Interview } from '../models/Interview';
import { AppError } from '../middlewares/errorHandler';

export const getMyInterviews = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.id;
    const interviewRepository = AppDataSource.getRepository(Interview);

    const interviews = await interviewRepository
      .createQueryBuilder('interview')
      .leftJoinAndSelect('interview.application', 'application')
      .leftJoinAndSelect('interview.room', 'room')
      .leftJoinAndSelect('application.user', 'user')
      .where('user.id = :userId', { userId })
      .orderBy('interview.scheduledAt', 'DESC')
      .getMany();

    res.json(interviews);
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
    const userId = req.user!.id;
    const interviewRepository = AppDataSource.getRepository(Interview);

    const interview = await interviewRepository
      .createQueryBuilder('interview')
      .leftJoinAndSelect('interview.application', 'application')
      .leftJoinAndSelect('interview.room', 'room')
      .leftJoinAndSelect('application.user', 'user')
      .where('interview.id = :id', { id })
      .andWhere('user.id = :userId', { userId })
      .getOne();

    if (!interview) {
      throw new AppError('Interview not found', 404);
    }

    res.json(interview);
  } catch (error) {
    next(error);
  }
};