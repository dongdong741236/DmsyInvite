import { Request, Response, NextFunction } from 'express';
import { AppDataSource } from '../config/database';
import { Application, ApplicationStatus } from '../models/Application';
import { AppError } from '../middlewares/errorHandler';

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

    // Check if user already has an application for current recruitment
    const existingApplication = await applicationRepository.findOne({
      where: {
        user: { id: userId },
        createdAt: new Date(new Date().getFullYear(), 0, 1), // Current year
      },
    });

    if (existingApplication) {
      throw new AppError('You already have an application for this recruitment period', 400);
    }

    const application = applicationRepository.create({
      ...req.body,
      user: { id: userId },
    });

    await applicationRepository.save(application);

    res.status(201).json({
      message: 'Application submitted successfully',
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