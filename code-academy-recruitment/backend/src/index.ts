import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

console.log('=== 后端启动开始 ===');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT);
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_USER:', process.env.DB_USER);

const app = express();
const PORT = process.env.PORT || 5000;

try {
  // Basic middleware
  app.use(cors());
  app.use(express.json());
  
  console.log('中间件加载完成');

  // Health check
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });
  
  console.log('路由设置完成');

  // Start server
  app.listen(PORT, () => {
    console.log(`=== 服务器启动成功，端口: ${PORT} ===`);
  });
  
  console.log('监听端口设置完成');

} catch (error) {
  console.error('=== 启动失败 ===', error);
  process.exit(1);
}

console.log('=== 启动脚本执行完成 ===');