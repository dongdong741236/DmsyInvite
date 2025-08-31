import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { AppDataSource } from '../config/database';
import { User } from '../models/User';
import { AppError } from '../middlewares/errorHandler';
import { sendVerificationEmail, sendVerificationCode } from '../utils/email';
import redisClient from '../config/redis';

const generateToken = (user: User): string => {
  const payload = {
    userId: user.id,
    email: user.email,
    role: user.role,
  };
  
  const secret = process.env.JWT_SECRET || 'secret';
  
  return jwt.sign(payload, secret, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  } as jwt.SignOptions);
};

// 生成6位数验证码
const generateVerificationCode = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const sendEmailVerificationCode = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email } = req.body;
    const userRepository = AppDataSource.getRepository(User);

    // 检查邮箱是否已注册
    const existingUser = await userRepository.findOne({ where: { email } });
    if (existingUser) {
      throw new AppError('该邮箱已注册', 400);
    }

    // 生成验证码
    const verificationCode = generateVerificationCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10分钟后过期

    // 将验证码存储在 Redis 中
    await redisClient.setEx(
      `email_verification:${email}`,
      600, // 10分钟
      JSON.stringify({
        code: verificationCode,
        expiresAt: expiresAt.toISOString(),
        attempts: 0,
      })
    );

    // 发送验证码邮件
    await sendVerificationCode(email, verificationCode);

    res.json({
      message: '验证码已发送到您的邮箱，有效期10分钟',
      expiresAt,
    });
  } catch (error) {
    next(error);
  }
};

export const verifyEmailCode = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, code } = req.body;

    // 从 Redis 获取验证码信息
    const verificationData = await redisClient.get(`email_verification:${email}`);
    
    if (!verificationData) {
      throw new AppError('验证码已过期或不存在', 400);
    }

    const { code: storedCode, expiresAt, attempts } = JSON.parse(verificationData);

    // 检查是否过期
    if (new Date() > new Date(expiresAt)) {
      await redisClient.del(`email_verification:${email}`);
      throw new AppError('验证码已过期', 400);
    }

    // 检查尝试次数（防止暴力破解）
    if (attempts >= 5) {
      await redisClient.del(`email_verification:${email}`);
      throw new AppError('验证失败次数过多，请重新获取验证码', 400);
    }

    // 验证码错误
    if (code !== storedCode) {
      // 增加尝试次数
      await redisClient.setEx(
        `email_verification:${email}`,
        Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000),
        JSON.stringify({
          code: storedCode,
          expiresAt,
          attempts: attempts + 1,
        })
      );
      throw new AppError('验证码错误', 400);
    }

    // 验证成功，删除验证码
    await redisClient.del(`email_verification:${email}`);

    // 标记邮箱已验证（临时存储）
    await redisClient.setEx(
      `email_verified:${email}`,
      1800, // 30分钟内有效
      'true'
    );

    res.json({
      message: '邮箱验证成功',
      verified: true,
    });
  } catch (error) {
    next(error);
  }
};

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password, name } = req.body;
    const userRepository = AppDataSource.getRepository(User);

    // 检查邮箱是否已验证
    const isEmailVerified = await redisClient.get(`email_verified:${email}`);
    if (!isEmailVerified) {
      throw new AppError('请先验证邮箱', 400);
    }

    // 检查用户是否已存在
    const existingUser = await userRepository.findOne({ where: { email } });
    if (existingUser) {
      throw new AppError('该邮箱已注册', 400);
    }

    // 创建用户（邮箱已验证）
    const user = userRepository.create({
      email,
      password,
      name,
      isEmailVerified: true, // 直接设置为已验证
    });

    await userRepository.save(user);

    // 清除邮箱验证标记
    await redisClient.del(`email_verified:${email}`);

    // 生成 JWT
    const token = generateToken(user);

    res.status(201).json({
      message: '注册成功',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password } = req.body;
    const userRepository = AppDataSource.getRepository(User);

    // Find user
    const user = await userRepository.findOne({ where: { email } });
    if (!user) {
      throw new AppError('Invalid credentials', 401);
    }

    // Check password
    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      throw new AppError('Invalid credentials', 401);
    }

    // Generate token
    const token = generateToken(user);

    // Store token in Redis for session management
    await redisClient.setEx(`session:${user.id}`, 7 * 24 * 60 * 60, token);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const verifyEmail = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { token } = req.query;
    
    if (!token || typeof token !== 'string') {
      throw new AppError('Invalid verification token', 400);
    }

    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({
      where: { emailVerificationToken: token },
    });

    if (!user) {
      throw new AppError('Invalid or expired verification token', 400);
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    await userRepository.save(user);

    res.json({
      message: 'Email verified successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const forgotPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email } = req.body;
    const userRepository = AppDataSource.getRepository(User);

    const user = await userRepository.findOne({ where: { email } });
    if (!user) {
      // Don't reveal if user exists
      res.json({
        message: 'If the email exists, a reset link has been sent.',
      });
      return;
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hour

    await userRepository.save(user);

    // TODO: Send reset email
    // await sendResetPasswordEmail(email, resetToken);

    res.json({
      message: 'If the email exists, a reset link has been sent.',
    });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { token, password } = req.body;
    const userRepository = AppDataSource.getRepository(User);

    const user = await userRepository.findOne({
      where: {
        resetPasswordToken: token,
      },
    });

    if (!user || !user.resetPasswordExpires || user.resetPasswordExpires < new Date()) {
      throw new AppError('Invalid or expired reset token', 400);
    }

    // Update password
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    
    await userRepository.save(user);

    res.json({
      message: 'Password reset successful',
    });
  } catch (error) {
    next(error);
  }
};