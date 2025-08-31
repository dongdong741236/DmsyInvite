# 🔧 后端容器问题修复

## 🚨 问题诊断结果

通过本地测试发现：

### ✅ 正常的部分
- Node.js 运行正常
- 所有模块加载成功
- TypeScript 编译无错误
- Express 应用可以正常启动

### ❌ 问题根因
**数据库配置默认值错误**：
- `DB_HOST` 默认值为 `localhost`，但容器内应该是 `mysql`
- `REDIS_HOST` 默认值为 `localhost`，但容器内应该是 `redis`

## ✅ 修复内容

### 1. 数据库配置修复
```typescript
// 修复前
host: process.env.DB_HOST || 'localhost',  // ❌ 容器内无效

// 修复后  
host: process.env.DB_HOST || 'mysql',      // ✅ 容器名
```

### 2. Redis 配置修复
```typescript
// 修复前
host: process.env.REDIS_HOST || 'localhost',  // ❌ 容器内无效

// 修复后
host: process.env.REDIS_HOST || 'redis',      // ✅ 容器名
```

### 3. ConfigService 修复
修复了静态属性初始化问题：
```typescript
// 修复前
private static configRepository = AppDataSource.getRepository(SystemConfig);

// 修复后
private static getRepository() {
  return AppDataSource.getRepository(SystemConfig);
}
```

## 🚀 立即修复

**在您的服务器上运行：**

```bash
./deploy.sh clean
```

这会：
1. 使用修复后的代码重新构建镜像
2. 启动服务
3. 详细的健康检查

## 📊 预期结果

修复后，后端日志应该显示：
```
info: Database and Redis connections established
info: System configurations initialized
info: Default admin user created
info: Server running on port 5000
```

容器状态应该是：
```
recruitment-backend   Up   0.0.0.0:45000->5000/tcp
```

## 🔍 验证修复

```bash
# 检查容器状态
docker compose ps

# 测试 API
curl http://localhost:45000/health

# 查看后端日志
docker logs recruitment-backend
```

## 💡 为什么会出现这个问题

1. **容器网络环境**：容器内无法通过 `localhost` 连接其他容器
2. **默认值设计**：原本为本地开发设计的默认值在容器环境中无效
3. **环境变量覆盖**：即使 docker-compose 设置了正确值，代码中的默认值仍然会在某些情况下生效

## 🎯 修复验证

修复成功的标志：
- ✅ 后端容器状态为 `Up`
- ✅ 后端日志显示成功启动信息
- ✅ API 健康检查返回正常
- ✅ 不再有重启循环

---

**立即修复命令：**
```bash
./deploy.sh clean
```

现在后端应该能正常启动了！