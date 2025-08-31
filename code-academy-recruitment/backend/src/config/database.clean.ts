import { DataSource } from 'typeorm';
import dotenv from 'dotenv';
import { User } from '../models/User';
import { Application } from '../models/Application';
import { Interview } from '../models/Interview';
import { InterviewRoom } from '../models/InterviewRoom';

dotenv.config();

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  username: process.env.DB_USER || 'recruitment_user',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'recruitment_db',
  synchronize: process.env.NODE_ENV === 'development',
  logging: process.env.NODE_ENV === 'development',
  entities: [User, Application, Interview, InterviewRoom],
  migrations: ['src/migrations/*.ts'],
  subscribers: ['src/subscribers/*.ts'],
  // 最基础的 MySQL 配置，无任何额外选项
  charset: 'utf8mb4',
  timezone: '+08:00',
});