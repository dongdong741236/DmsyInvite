import { AppDataSource } from '../config/database';
import { User, UserRole } from '../models/User';
import { logger } from './logger';
import bcrypt from 'bcryptjs';

export const createDefaultAdmin = async () => {
  try {
    const userRepository = AppDataSource.getRepository(User);
    
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@codeacademy.edu.cn';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123456';
    
    console.log('=== 创建默认管理员用户 ===');
    console.log('管理员邮箱:', adminEmail);
    console.log('管理员密码:', adminPassword);
    
    const existingAdmin = await userRepository.findOne({
      where: { email: adminEmail },
    });

    if (!existingAdmin) {
      console.log('管理员用户不存在，开始创建...');
      
      const hashedPassword = await bcrypt.hash(adminPassword, 10);

      const admin = userRepository.create({
        email: adminEmail,
        password: hashedPassword,
        name: 'System Admin',
        role: UserRole.ADMIN,
        isEmailVerified: true,
      });

      await userRepository.save(admin);
      console.log('✅ 默认管理员用户创建成功');
      console.log('管理员邮箱:', adminEmail);
      console.log('管理员密码:', adminPassword);
      logger.info('Default admin user created', { email: adminEmail });
    } else {
      console.log('✅ 管理员用户已存在');
      console.log('管理员邮箱:', existingAdmin.email);
      console.log('管理员角色:', existingAdmin.role);
      logger.info('Admin user already exists', { email: adminEmail });
    }
  } catch (error) {
    console.error('❌ 创建管理员用户失败:', error);
    logger.error('Failed to create default admin:', error);
  }
};