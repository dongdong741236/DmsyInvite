import { Request, Response, NextFunction } from 'express';
import { RecruitmentYearService } from '../services/recruitmentYear.service';

export const getYears = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const years = await RecruitmentYearService.getAllYears();
    res.json(years);
  } catch (error) {
    next(error);
  }
};

export const getCurrentYear = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const currentYear = await RecruitmentYearService.getCurrentYear();
    res.json(currentYear);
  } catch (error) {
    next(error);
  }
};

export const createYear = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { year, name, description, startDate, endDate } = req.body;
    
    const newYear = await RecruitmentYearService.createYear({
      year,
      name,
      description,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });

    res.status(201).json({
      message: 'Recruitment year created successfully',
      year: newYear,
    });
  } catch (error) {
    next(error);
  }
};

export const activateYear = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    
    if (!id) {
      res.status(400).json({ error: 'Year ID is required' });
      return;
    }
    
    const year = await RecruitmentYearService.activateYear(id);

    res.json({
      message: 'Recruitment year activated successfully',
      year,
    });
  } catch (error) {
    next(error);
  }
};

export const archiveYear = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    
    if (!id) {
      res.status(400).json({ error: 'Year ID is required' });
      return;
    }
    
    const year = await RecruitmentYearService.archiveYear(id);

    res.json({
      message: 'Recruitment year archived successfully',
      year,
    });
  } catch (error) {
    next(error);
  }
};