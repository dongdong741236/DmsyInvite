import { AppDataSource } from '../config/database';
import { User, UserRole } from '../models/User';
import { logger } from './logger';
import bcrypt from 'bcryptjs';

export const createDefaultAdmin = async () => {
  try {
    const userRepository = AppDataSource.getRepository(User);
    
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@codeacademy.edu.cn';
    const existingAdmin = await userRepository.findOne({
      where: { email: adminEmail },
    });

    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash(
        process.env.ADMIN_PASSWORD || 'admin123456',
        10
      );

      const admin = userRepository.create({
        email: adminEmail,
        password: hashedPassword,
        name: 'System Admin',
        role: UserRole.ADMIN,
        isEmailVerified: true,
      });

      await userRepository.save(admin);
      logger.info('Default admin user created');
    }
  } catch (error) {
    logger.error('Failed to create default admin:', error);
  }
};