# 🎯 最终部署指南

## 🚨 当前问题分析

根据您的部署日志，主要问题是：

1. **MySQL 容器启动失败** - `recruitment-mysql is unhealthy`
2. **内核不支持 swap limit** - 导致内存限制配置无效

## ✅ 解决方案

我已经创建了专门的修复版本来解决这些问题。

### 方案1: 使用修复脚本（推荐）

```bash
# 在您的服务器上运行
./fix-deploy.sh
```

这个脚本会：
- 停止所有现有容器
- 清理可能冲突的资源
- 使用简化配置分步启动服务
- 详细的错误诊断

### 方案2: 使用简化配置

```bash
# 停止现有服务
docker compose down

# 使用简化配置启动
docker compose -f docker-compose.simple.yml up -d

# 查看状态
docker compose -f docker-compose.simple.yml ps
```

### 方案3: 手动诊断和修复

```bash
# 1. 运行诊断脚本
./debug-mysql.sh

# 2. 根据诊断结果修复问题
# 3. 重新部署
```

## 🔧 简化配置的改进

`docker-compose.simple.yml` 的优化：

1. **移除内存限制**
   ```yaml
   # 移除了这些配置（您的内核不支持）
   # deploy:
   #   resources:
   #     limits:
   #       memory: 512M
   ```

2. **简化健康检查**
   ```yaml
   healthcheck:
     test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
     interval: 30s  # 增加间隔
     timeout: 10s   # 增加超时
     retries: 3     # 减少重试次数
     start_period: 60s  # 增加启动等待时间
   ```

3. **简化 MySQL 启动命令**
   ```yaml
   # 移除可能有问题的参数
   command: --default-authentication-plugin=mysql_native_password --character-set-server=utf8mb4 --collation-server=utf8mb4_unicode_ci
   ```

## 📋 部署步骤

### 步骤1: 清理环境

```bash
# 停止所有容器
docker compose down
docker compose -f docker-compose.arm.yml down

# 清理容器（如果需要）
docker container prune -f
```

### 步骤2: 检查配置

```bash
# 确保配置文件存在
ls -la .env

# 检查关键配置
grep -E "DB_PASSWORD|REDIS_PASSWORD|JWT_SECRET" .env
```

### 步骤3: 使用修复脚本

```bash
./fix-deploy.sh
```

### 步骤4: 验证部署

```bash
# 检查所有容器状态
docker compose -f docker-compose.simple.yml ps

# 测试访问
curl http://localhost:45000/health
curl http://localhost:43000
```

## 🆘 如果 MySQL 仍然失败

### 检查具体错误

```bash
# 查看 MySQL 详细日志
docker logs recruitment-mysql

# 查看 MySQL 启动过程
docker compose -f docker-compose.simple.yml up mysql
```

### 常见 MySQL 问题

1. **权限问题**
   ```bash
   # 重置 MySQL 数据卷
   docker volume rm code-academy-recruitment_mysql_data
   ```

2. **端口冲突**
   ```bash
   # 检查端口占用
   sudo netstat -tlnp | grep :43306
   ```

3. **配置错误**
   ```bash
   # 检查环境变量
   docker compose -f docker-compose.simple.yml config
   ```

### 最简化 MySQL 启动

如果仍有问题，可以使用最基础的 MySQL 配置：

```bash
# 临时启动 MySQL（测试用）
docker run -d --name temp-mysql \
  -e MYSQL_ROOT_PASSWORD=root123 \
  -e MYSQL_DATABASE=recruitment_db \
  -e MYSQL_USER=recruitment_user \
  -e MYSQL_PASSWORD=password123 \
  -p 43306:3306 \
  mysql:8.0

# 测试连接
sleep 30
docker exec temp-mysql mysqladmin ping
```

## 🌐 访问地址（修复后）

- **前端界面**: http://your-server-ip:43000
- **后端 API**: http://your-server-ip:45000  
- **MySQL 数据库**: your-server-ip:43306
- **Redis 缓存**: your-server-ip:46379

## 📞 获取帮助

如果问题持续存在：

1. 运行诊断：`./debug-mysql.sh`
2. 查看日志：`docker compose logs mysql`
3. 检查系统资源：`free -h && df -h`
4. 使用简化配置：`docker compose -f docker-compose.simple.yml up -d`

---

**快速修复命令：**
```bash
docker compose down && ./fix-deploy.sh
```