import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';
import { AppDataSource } from './config/database';
import { connectRedis } from './config/redis';
import { errorHandler } from './middlewares/errorHandler';
import { logger } from './utils/logger';
import routes from './routes';
import { createDefaultAdmin } from './utils/initAdmin';
import { ConfigService } from './services/config.service';

// Load environment variables
dotenv.config();

console.log('=== 后端启动开始 ===');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT);
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_USER:', process.env.DB_USER);
console.log('REDIS_HOST:', process.env.REDIS_HOST);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:43000',
  credentials: true
}));
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

console.log('中间件配置完成');

// Routes
app.use('/api', routes);

// Static file serving for uploads
app.use('/uploads', express.static('uploads'));

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

console.log('路由配置完成');

// Error handling
app.use(errorHandler);

// Initialize with detailed logging
async function startServer() {
  try {
    console.log('开始初始化数据库连接...');
    logger.info('Initializing database connection...');
    
    await AppDataSource.initialize();
    console.log('✅ 数据库连接成功');
    logger.info('Database connection established');
    
    console.log('开始初始化 Redis 连接...');
    logger.info('Initializing Redis connection...');
    
    await connectRedis();
    console.log('✅ Redis 连接成功');
    logger.info('Redis connection established');
    
    console.log('开始创建默认管理员用户...');
    logger.info('Creating default admin user...');
    
    await createDefaultAdmin();
    console.log('✅ 默认管理员用户创建完成');
    logger.info('Default admin user created');
    
    console.log('启动 HTTP 服务器...');
    app.listen(PORT, () => {
      console.log(`=== 服务器启动成功，端口: ${PORT} ===`);
      logger.info(`Server running on port ${PORT}`);
    });
    
    // Initialize system configurations after server starts (non-blocking)
    setTimeout(async () => {
      try {
        console.log('开始初始化系统配置...');
        logger.info('Initializing system configurations...');
        
        await ConfigService.initializeDefaults();
        console.log('✅ 系统配置初始化完成');
        logger.info('System configurations initialized');
        
        // 初始化邮件模板
        const { EmailTemplateService } = await import('./services/emailTemplate.service');
        await EmailTemplateService.initializeDefaultTemplates();
        console.log('✅ 邮件模板初始化完成');
        
        // 初始化面试问题
        const { initializeDefaultQuestions } = await import('./controllers/interviewQuestion.controller');
        await initializeDefaultQuestions();
        console.log('✅ 面试问题初始化完成');
        
        // 初始化招新年度
        const { RecruitmentYearService } = await import('./services/recruitmentYear.service');
        await RecruitmentYearService.initializeDefaultYear();
        console.log('✅ 招新年度初始化完成');
      } catch (error) {
        console.error('❌ 系统配置初始化失败:', error);
        logger.error('Failed to initialize system configurations:', error);
        // Don't exit, just log the error
      }
    }, 10000); // 增加延迟到10秒
    
  } catch (error) {
    console.error('=== 服务器启动失败 ===', error);
    logger.error('Server startup failed:', error);
    process.exit(1);
  }
}

startServer();

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('收到 SIGTERM 信号，正在关闭服务器...');
  logger.info('SIGTERM signal received: closing HTTP server');
  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy();
  }
  process.exit(0);
});

export default app;