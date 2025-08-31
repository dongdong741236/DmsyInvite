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

// Routes
app.use('/api', routes);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling
app.use(errorHandler);

// Initialize database and Redis, then start server
Promise.all([
  AppDataSource.initialize(),
  connectRedis()
])
  .then(async () => {
    logger.info('Database and Redis connections established');
    
    // 暂时跳过配置初始化，避免启动问题
    // await ConfigService.initializeDefaults();
    // logger.info('System configurations initialized');
    
    // Create default admin user
    await createDefaultAdmin();
    
    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    logger.error('Database or Redis connection failed:', error);
    process.exit(1);
  });

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  await AppDataSource.destroy();
  process.exit(0);
});

export default app;