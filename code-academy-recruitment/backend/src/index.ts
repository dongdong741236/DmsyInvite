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
async function startServer() {
  try {
    logger.info('Initializing database connection...');
    await AppDataSource.initialize();
    logger.info('Database connection established');
    
    logger.info('Initializing Redis connection...');
    await connectRedis();
    logger.info('Redis connection established');
    
    // Create default admin user
    logger.info('Creating default admin user...');
    await createDefaultAdmin();
    logger.info('Default admin user created');
    
    // Start HTTP server
    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
    });
    
    // Initialize system configurations after server starts (non-blocking)
    setTimeout(async () => {
      try {
        logger.info('Initializing system configurations...');
        await ConfigService.initializeDefaults();
        logger.info('System configurations initialized');
      } catch (error) {
        logger.error('Failed to initialize system configurations:', error);
        // Don't exit, just log the error
      }
    }, 5000);
    
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