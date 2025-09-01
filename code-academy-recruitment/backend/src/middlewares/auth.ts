import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppDataSource } from '../config/database';
import { User, UserRole } from '../models/User';
import { Interviewer } from '../models/Interviewer';

interface JwtPayload {
  userId: string;
  email: string;
  role: UserRole | string;
  userType?: 'user' | 'interviewer';
}

declare global {
  namespace Express {
    interface Request {
      user?: User | Interviewer;
    }
  }
}

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      res.status(401).json({ error: 'No token provided' });
      return;
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'secret'
    ) as JwtPayload;

    let user: User | Interviewer | null = null;

    // 根据 userType 查找对应的用户
    if (decoded.userType === 'interviewer') {
      const interviewerRepository = AppDataSource.getRepository(Interviewer);
      user = await interviewerRepository.findOne({
        where: { id: decoded.userId },
      });
    } else {
      const userRepository = AppDataSource.getRepository(User);
      user = await userRepository.findOne({
        where: { id: decoded.userId },
      });
    }

    if (!user) {
      res.status(401).json({ error: 'User not found' });
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

export const authorize = (roles: (UserRole | string)[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    if (!roles.includes(req.user.role as any)) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    next();
  };
};