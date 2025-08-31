import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';
import { AppDataSource } from './config/database';
import { connectRedis } from './config/redis';
import { errorHandler } from './middlewares/errorHandler';
import { logger } from './utils/logger';

// Load environment variables
dotenv.config();

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

// 基本路由
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling
app.use(errorHandler);

// 简化启动流程，先只测试基本功能
async function startServer() {
  try {
    logger.info('Starting minimal backend server...');
    
    // 先启动服务器，不连接数据库
    app.listen(PORT, () => {
      logger.info(`Minimal server running on port ${PORT}`);
    });
    
    // 然后尝试连接数据库
    setTimeout(async () => {
      try {
        await AppDataSource.initialize();
        logger.info('Database connection established');
        
        await connectRedis();
        logger.info('Redis connection established');
        
        logger.info('All connections ready');
      } catch (error) {
        logger.error('Database or Redis connection failed:', error);
        // 不退出，继续运行基本服务
      }
    }, 2000);
    
  } catch (error) {
    logger.error('Server startup failed:', error);
    process.exit(1);
  }
}

startServer();

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy();
  }
  process.exit(0);
});

export default app;