# 🔧 故障排除指南

## 常见部署问题及解决方案

### 1. npm ci 错误

**问题描述：**
```
npm error The `npm ci` command can only install with an existing package-lock.json
```

**原因：** 缺少 `package-lock.json` 文件

**解决方案：**
```bash
# 在项目根目录执行
cd backend && npm install
cd ../frontend && npm install

# 然后重新构建
docker compose build --no-cache
```

### 2. Docker Compose 版本警告

**问题描述：**
```
WARN: the attribute `version` is obsolete, it will be ignored
```

**原因：** Docker Compose V2 不再需要 version 字段

**解决方案：** 已修复，忽略此警告不影响功能

### 3. 端口被占用

**问题描述：**
```
Error starting userland proxy: listen tcp 0.0.0.0:43000: bind: address already in use
```

**解决方案：**
```bash
# 检查端口占用
sudo netstat -tlnp | grep :43000
sudo lsof -i :43000

# 停止占用进程
sudo kill -9 <PID>

# 或修改端口配置
nano docker-compose.yml
# 将 "43000:80" 改为其他端口如 "44000:80"
```

### 4. 权限被拒绝

**问题描述：**
```
permission denied while trying to connect to the Docker daemon
```

**解决方案：**
```bash
# 添加用户到 docker 组
sudo usermod -aG docker $USER

# 重新登录或执行
newgrp docker

# 验证权限
docker ps
```

### 5. 内存不足

**问题描述：**
容器启动失败或运行缓慢

**解决方案：**
```bash
# 检查内存使用
free -h
docker stats

# 增加 swap 空间
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# 永久启用
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

### 6. MySQL 连接失败

**问题描述：**
```
Error: connect ECONNREFUSED 127.0.0.1:3306
```

**解决方案：**
```bash
# 检查 MySQL 容器状态
docker compose ps mysql

# 查看 MySQL 日志
docker compose logs mysql

# 检查健康状态
docker compose exec mysql mysqladmin ping

# 重启 MySQL
docker compose restart mysql
```

### 7. 前端页面无法访问

**问题描述：**
浏览器显示无法连接

**解决方案：**
```bash
# 检查容器状态
docker compose ps frontend

# 检查端口映射
docker port recruitment-frontend

# 查看 Nginx 日志
docker compose logs frontend

# 测试本地访问
curl http://localhost:43000
```

### 8. API 请求失败

**问题描述：**
前端无法连接后端 API

**解决方案：**
```bash
# 检查后端容器
docker compose ps backend

# 测试 API 健康检查
curl http://localhost:45000/health

# 查看后端日志
docker compose logs backend

# 检查网络连接
docker network ls
docker network inspect code-academy-recruitment_recruitment-network
```

## 🐛 调试技巧

### 查看详细日志

```bash
# 查看所有服务日志
docker compose logs

# 查看特定服务日志
docker compose logs backend
docker compose logs mysql

# 实时查看日志
docker compose logs -f backend

# 查看最近的日志
docker compose logs --tail=50 backend
```

### 进入容器调试

```bash
# 进入后端容器
docker compose exec backend sh

# 进入 MySQL 容器
docker compose exec mysql bash

# 进入前端容器
docker compose exec frontend sh

# 在容器中执行命令
docker compose exec backend npm run build
```

### 检查配置

```bash
# 验证 docker-compose.yml 语法
docker compose config

# 查看解析后的配置
docker compose config --services

# 检查环境变量
docker compose exec backend env
```

### 网络诊断

```bash
# 检查容器网络
docker network ls

# 检查容器 IP
docker compose exec backend hostname -i

# 测试容器间连接
docker compose exec backend ping mysql
docker compose exec frontend ping backend
```

## 🔄 重置和重建

### 完全重置

```bash
# 停止所有服务
docker compose down

# 删除所有数据（⚠️ 会丢失数据）
docker compose down -v

# 清理镜像
docker system prune -a

# 重新构建
docker compose build --no-cache
docker compose up -d
```

### 部分重建

```bash
# 只重建后端
docker compose build --no-cache backend
docker compose up -d backend

# 只重建前端
docker compose build --no-cache frontend
docker compose up -d frontend
```

## 📊 性能问题

### 启动缓慢

**ARM 设备启动时间较长是正常的：**
- Apple M1/M2: ~30秒
- 树莓派 4: ~60-90秒
- 低配置设备: 可能需要2-3分钟

**优化建议：**
```bash
# 使用 ARM 优化配置
docker compose -f docker-compose.arm.yml up -d

# 增加启动等待时间
sleep 60
docker compose ps
```

### 内存使用过高

```bash
# 查看内存使用
docker stats --format "table {{.Container}}\t{{.MemUsage}}\t{{.MemPerc}}"

# 限制容器内存（在 docker-compose.yml 中）
deploy:
  resources:
    limits:
      memory: 512M
```

## 🆘 紧急恢复

### 服务无响应

```bash
# 强制重启所有服务
docker compose kill
docker compose up -d

# 检查系统资源
htop
df -h
```

### 数据损坏

```bash
# 恢复最近的备份
ls backups/
docker compose exec -T mysql mysql -u recruitment_user -p recruitment_db < backups/backup_latest.sql
```

### 配置错误

```bash
# 重置配置文件
cp .env.example .env
nano .env

# 验证配置
docker compose config
```

## 📞 获取帮助

**检查清单：**
1. 运行环境检查：`./check-env.sh`
2. 查看详细日志：`docker compose logs`
3. 检查系统资源：`htop` 和 `df -h`
4. 验证网络连接：`curl http://localhost:45000/health`

**日志位置：**
- 应用日志：`docker compose logs`
- 系统日志：`journalctl -u docker`
- MySQL 日志：`docker compose exec mysql tail -f /var/log/mysql/error.log`

**快速重启：**
```bash
docker compose restart
# 或
make restart
```