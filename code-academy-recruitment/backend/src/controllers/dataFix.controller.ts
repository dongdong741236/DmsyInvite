import { Request, Response, NextFunction } from 'express';
import { AppDataSource } from '../config/database';

class AppError extends Error {
  statusCode: number;
  
  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'AppError';
  }
}

/**
 * 检查数据完整性问题
 */
export const checkDataIntegrity = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // 使用原始查询来检查数据完整性
    const interviewsWithNullApplication = await AppDataSource.query(`
      SELECT id, scheduledAt, roomId, createdAt 
      FROM interviews 
      WHERE applicationId IS NULL
    `);

    const applicationsWithoutInterview = await AppDataSource.query(`
      SELECT a.id, a.studentId, a.status, a.createdAt 
      FROM applications a 
      WHERE a.status = 'interview_scheduled' 
        AND NOT EXISTS (SELECT 1 FROM interviews i WHERE i.applicationId = a.id)
    `);

    const incorrectNotificationFlags = await AppDataSource.query(`
      SELECT i.id as interviewId, i.applicationId, i.notificationSent, a.status as applicationStatus
      FROM interviews i
      LEFT JOIN applications a ON i.applicationId = a.id
      WHERE i.notificationSent = true 
        AND (a.status NOT IN ('accepted', 'rejected') OR a.status IS NULL)
    `);

    res.json({
      issues: {
        interviewsWithNullApplication: {
          count: interviewsWithNullApplication.length,
          records: interviewsWithNullApplication,
        },
        applicationsWithoutInterview: {
          count: applicationsWithoutInterview.length,
          records: applicationsWithoutInterview,
        },
        incorrectNotificationFlags: {
          count: incorrectNotificationFlags.length,
          records: incorrectNotificationFlags,
        },
      },
      summary: {
        totalIssues: 
          interviewsWithNullApplication.length + 
          applicationsWithoutInterview.length + 
          incorrectNotificationFlags.length,
        critical: interviewsWithNullApplication.length > 0,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 修复notificationSent标志
 */
export const fixNotificationFlags = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // 使用原始查询来修复
    const result = await AppDataSource.query(`
      UPDATE interviews i
      JOIN applications a ON i.applicationId = a.id
      SET i.notificationSent = false
      WHERE i.notificationSent = true 
        AND a.status NOT IN ('accepted', 'rejected')
    `);

    res.json({
      message: 'Notification flags fixed',
      affectedRows: result.affectedRows,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 尝试修复NULL的applicationId
 */
export const fixNullApplicationIds = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { interviewId, applicationId } = req.body;

    if (!interviewId || !applicationId) {
      throw new AppError('Both interviewId and applicationId are required', 400);
    }

    // 使用原始查询检查
    const [interview] = await AppDataSource.query(
      'SELECT * FROM interviews WHERE id = ?',
      [interviewId]
    );

    if (!interview) {
      throw new AppError('Interview not found', 404);
    }

    if (interview.applicationId) {
      throw new AppError('Interview already has an applicationId', 400);
    }

    const [application] = await AppDataSource.query(
      'SELECT * FROM applications WHERE id = ?',
      [applicationId]
    );

    if (!application) {
      throw new AppError('Application not found', 404);
    }

    const [existingInterview] = await AppDataSource.query(
      'SELECT * FROM interviews WHERE applicationId = ?',
      [applicationId]
    );

    if (existingInterview) {
      throw new AppError('Application already has an interview', 400);
    }

    // 修复关联
    await AppDataSource.query(
      'UPDATE interviews SET applicationId = ? WHERE id = ?',
      [applicationId, interviewId]
    );

    // 更新申请状态
    if (application.status === 'approved') {
      await AppDataSource.query(
        'UPDATE applications SET status = ? WHERE id = ?',
        ['interview_scheduled', applicationId]
      );
    }

    res.json({
      message: 'Interview-Application link fixed',
      interview: {
        id: interviewId,
        applicationId: applicationId,
      },
      application: {
        id: applicationId,
        status: 'interview_scheduled',
      },
    });
  } catch (error) {
    next(error);
  }
};