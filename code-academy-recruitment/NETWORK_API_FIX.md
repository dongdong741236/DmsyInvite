# 🌐 网络和 API 问题修复指南

## 🚨 问题分析

### 1. 前端 API 请求问题
**现象**: 前端请求 `http://localhost:45000/api/auth/register` 而不是容器内地址
**原因**: 前端在浏览器中运行，无法直接访问容器内网络

### 2. 后端容器网络问题  
**现象**: 后端容器没有分配 IP 地址
**原因**: Docker 网络配置或容器启动顺序问题

## ✅ 解决方案

### 修复1: 前端 API 代理配置

**问题**: 前端直接请求后端容器端口
**解决**: 通过 Nginx 代理转发 API 请求

**修改的配置**:
```nginx
# 在 nginx-simple.conf 中添加
location /api {
    proxy_pass http://recruitment-backend:5000;
    # ... 代理配置
}
```

**前端 API 配置**:
```typescript
// 修复前
const API_BASE_URL = 'http://localhost:45000/api';

// 修复后  
const API_BASE_URL = '/api';  // 使用相对路径，通过 Nginx 代理
```

### 修复2: Docker 网络配置

**确保所有服务在同一网络**:
```yaml
services:
  mysql:
    networks:
      - recruitment-network
  backend:
    networks:
      - recruitment-network  
  frontend:
    networks:
      - recruitment-network
```

## 🚀 立即修复方法

### 方法1: 网络修复脚本（推荐）

```bash
./fix-network.sh
```

这会：
- 重新创建 Docker 网络
- 分步启动服务确保网络连接
- 重建前端镜像应用新的代理配置
- 测试所有网络连接

### 方法2: 手动修复

```bash
# 1. 停止服务
docker compose -f docker-compose.working.yml down

# 2. 清理网络
docker network prune -f

# 3. 重建前端（应用新的 nginx 配置）
docker compose -f docker-compose.working.yml build --no-cache frontend

# 4. 启动服务
docker compose -f docker-compose.working.yml up -d

# 5. 检查网络
docker network inspect code-academy-recruitment_recruitment-network
```

### 方法3: 诊断网络问题

```bash
./debug-network.sh
```

## 🔍 验证修复成功

### 1. 检查容器网络

```bash
# 容器应该都有 IP 地址
docker compose -f docker-compose.working.yml ps

# 检查网络详情
docker network inspect code-academy-recruitment_recruitment-network
```

**预期结果**:
```
recruitment-mysql: 172.18.0.2/16
recruitment-redis: 172.18.0.3/16  
recruitment-backend: 172.18.0.4/16
recruitment-frontend: 172.18.0.5/16
```

### 2. 测试 API 访问

```bash
# 直接访问后端
curl http://localhost:45000/health

# 通过前端代理访问后端
curl http://localhost:43000/api/health

# 两个请求应该返回相同结果
```

### 3. 测试前端功能

```bash
# 访问前端页面
curl http://localhost:43000

# 检查前端是否能正确代理 API
curl http://localhost:43000/api/health
```

## 🎯 架构说明

### 修复后的网络架构

```
浏览器 → Nginx (43000) → React 应用
              ↓ /api/*
         Backend (recruitment-backend:5000)
              ↓
         MySQL (mysql:3306)
         Redis (redis:6379)
```

### API 请求流程

1. **浏览器发起请求**: `GET /api/auth/register`
2. **Nginx 接收请求**: 匹配 `/api` 路径
3. **Nginx 代理转发**: `http://recruitment-backend:5000/api/auth/register`
4. **后端处理请求**: 返回响应
5. **Nginx 返回响应**: 给浏览器

## 🔧 如果仍有问题

### 检查后端是否正常监听

```bash
# 进入后端容器检查
docker exec recruitment-backend netstat -tln | grep :5000

# 检查后端进程
docker exec recruitment-backend ps aux | grep node
```

### 检查前端代理配置

```bash
# 查看前端 nginx 配置
docker exec recruitment-frontend cat /etc/nginx/nginx.conf | grep -A 10 "location /api"

# 测试前端容器内的网络
docker exec recruitment-frontend ping recruitment-backend
```

### 重置网络

```bash
# 完全重置 Docker 网络
docker compose down
docker network prune -f
docker system prune -f
docker compose -f docker-compose.working.yml up -d
```

## 📞 紧急修复

如果网络问题持续存在：

### 选项1: 使用主机网络模式

```yaml
# 在 docker-compose.working.yml 中添加
services:
  backend:
    network_mode: "host"
  frontend:
    network_mode: "host"
```

### 选项2: 使用外部访问

修改 `.env` 文件：
```bash
REACT_APP_API_URL=http://your-server-ip:45000/api
```

---

**立即执行的修复命令：**
```bash
# 网络修复
./fix-network.sh

# 或诊断网络
./debug-network.sh
```