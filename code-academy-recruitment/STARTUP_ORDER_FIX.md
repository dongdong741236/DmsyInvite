# 🔧 容器启动顺序问题修复

## 🚨 问题分析

您说手动重启后一切正常，说明问题确实是**容器启动顺序**问题。

### 根本原因
1. **MySQL 初始化脚本问题** - optimize.sql 试图在表不存在时创建索引
2. **容器启动时机** - 后端在 MySQL 完全初始化前就尝试连接
3. **调试日志缺失** - 无法看到详细的错误信息

## ✅ 已完成的修复

### 1. 修复 MySQL 初始化
```yaml
# 移除会导致初始化失败的脚本
volumes:
  - ./docker/mysql/init.sql:/docker-entrypoint-initdb.d/init.sql:ro
  # 移除了 optimize.sql（会在表不存在时失败）
```

### 2. 增强容器启动顺序
```yaml
depends_on:
  mysql:
    condition: service_healthy  # 等待 MySQL 健康
  redis:
    condition: service_healthy  # 等待 Redis 健康
healthcheck:
  start_period: 60s  # 给后端60秒启动时间
```

### 3. 开启详细调试日志
```typescript
// 后端启动日志
console.log('=== 后端启动开始 ===');
console.log('DB_HOST:', process.env.DB_HOST);

// 数据库连接日志
logging: true,  // TypeORM 详细日志

// 邮件发送调试
console.log('=== 开始发送邮件 ===');
console.log('邮件配置:', process.env.EMAIL_HOST);
```

### 4. 优化启动逻辑
```typescript
async function startServer() {
  // 分步初始化，每步都有详细日志
  await AppDataSource.initialize();
  await connectRedis();
  await createDefaultAdmin();
  app.listen(PORT);
  
  // 延迟初始化非关键功能
  setTimeout(() => ConfigService.initializeDefaults(), 10000);
}
```

## 🚀 现在请测试

```bash
./deploy.sh clean
```

### 📊 预期的详细日志

**后端启动日志：**
```
=== 后端启动开始 ===
NODE_ENV: development
DB_HOST: mysql
开始初始化数据库连接...
✅ 数据库连接成功
开始初始化 Redis 连接...
✅ Redis 连接成功
=== 服务器启动成功，端口: 5000 ===
```

**邮件发送调试日志：**
```
=== 开始发送邮件 ===
邮件配置:
EMAIL_HOST: smtp.your-domain.com
EMAIL_USER: noreply@your-domain.com
收件人: test@stu.edu.cn
✅ 邮件发送成功: <message-id>
```

## 🔍 如果邮件发送失败

查看详细日志：
```bash
docker logs recruitment-backend | grep "邮件"
```

常见邮件问题：
1. **邮箱配置未设置** - 检查 .env 文件
2. **SMTP 服务器连接失败** - 检查网络和凭据
3. **邮箱服务商限制** - 检查是否需要应用密码

---

**立即测试修复：**
```bash
./deploy.sh clean
```

现在应该能看到详细的启动日志和邮件调试信息！