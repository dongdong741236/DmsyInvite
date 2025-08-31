import { Request, Response, NextFunction } from 'express';
import { ConfigService } from '../services/config.service';
import { AppError } from '../middlewares/errorHandler';

export const getConfigs = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const configs = await ConfigService.getAll();
    res.json(configs);
  } catch (error) {
    next(error);
  }
};

export const updateConfig = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { key, value, description } = req.body;
    
    if (!key || value === undefined) {
      throw new AppError('配置键和值不能为空', 400);
    }

    await ConfigService.set(key, value, description);

    res.json({
      message: '配置更新成功',
    });
  } catch (error) {
    next(error);
  }
};

export const updateConfigs = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { configs } = req.body;
    
    if (!Array.isArray(configs)) {
      throw new AppError('配置数据格式错误', 400);
    }

    await ConfigService.setBatch(configs);

    res.json({
      message: '批量配置更新成功',
    });
  } catch (error) {
    next(error);
  }
};

export const getRecruitmentStatus = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const freshmanEnabled = await ConfigService.get('recruitment.freshman.enabled', 'true');
    const sophomoreEnabled = await ConfigService.get('recruitment.sophomore.enabled', 'true');
    const deadline = await ConfigService.get('recruitment.application.deadline');
    const startTime = await ConfigService.get('recruitment.application.start_time');
    const maxApplications = await ConfigService.get('recruitment.max_applications_per_user', '1');

    const now = new Date();
    const isInApplicationPeriod = 
      (!startTime || new Date(startTime) <= now) &&
      (!deadline || new Date(deadline) >= now);

    res.json({
      freshmanEnabled: freshmanEnabled === 'true',
      sophomoreEnabled: sophomoreEnabled === 'true',
      deadline,
      startTime,
      maxApplications: parseInt(maxApplications),
      isInApplicationPeriod,
      currentTime: now.toISOString(),
    });
  } catch (error) {
    next(error);
  }
};