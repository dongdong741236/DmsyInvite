import { DataSource } from 'typeorm';
import dotenv from 'dotenv';
import { User } from '../models/User';
import { Application } from '../models/Application';
import { Interview } from '../models/Interview';
import { InterviewRoom } from '../models/InterviewRoom';
import { SystemConfig } from '../models/SystemConfig';

dotenv.config();

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST || 'mysql',
  port: parseInt(process.env.DB_PORT || '3306'),
  username: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'root_password',
  database: process.env.DB_NAME || 'recruitment_db',
  synchronize: true,  // 始终同步，确保表结构正确
  logging: true,      // 开启详细日志
  entities: [User, Application, Interview, InterviewRoom, SystemConfig],
  migrations: ['src/migrations/*.ts'],
  subscribers: ['src/subscribers/*.ts'],
  // MySQL 8.0 基础配置，无额外选项避免警告
  charset: 'utf8mb4',
  timezone: '+08:00',
});