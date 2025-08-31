# ⚡ 快速修复指南

## 🚨 当前问题

您遇到的错误：

1. **后端警告**：`Ignoring invalid configuration option passed to Connection`
2. **前端错误**：`unknown directive "brotli" in nginx.conf`

## ✅ 立即修复方案

### 方案1: 一键修复（推荐）

```bash
# 在您的服务器上运行
./immediate-fix.sh
```

这个脚本会：
- 停止所有服务
- 删除旧镜像和缓存
- 强制重新构建（无缓存）
- 启动修复后的服务
- 验证修复结果

### 方案2: 手动修复

```bash
# 1. 停止服务
docker compose down

# 2. 删除旧镜像
docker image rm code-academy-recruitment-backend code-academy-recruitment-frontend

# 3. 强制重建
docker compose -f docker-compose.working.yml build --no-cache

# 4. 启动服务
docker compose -f docker-compose.working.yml up -d
```

## 🔧 修复的具体内容

### 后端修复

**修改文件**: `backend/src/config/database.ts`

**修复前（有警告）**:
```typescript
extra: {
  connectionLimit: 20,
  acquireTimeout: 60000,  // ❌ mysql2 不支持
  timeout: 60000,         // ❌ mysql2 不支持
}
```

**修复后（无警告）**:
```typescript
// 移除所有 extra 配置，使用默认值
charset: 'utf8mb4',
timezone: '+08:00',
```

### 前端修复

**修改文件**: `frontend/nginx-simple.conf`

**修复前（报错）**:
```nginx
brotli on;  # ❌ 模块不存在
```

**修复后（正常）**:
```nginx
# brotli on;  # ✅ 注释掉，只使用 gzip
```

## 🎯 验证修复成功

修复后应该看到：

### 正常的容器状态
```
NAME                    STATUS              PORTS
recruitment-mysql       Up (healthy)        0.0.0.0:43306->3306/tcp
recruitment-redis       Up (healthy)        0.0.0.0:46379->6379/tcp
recruitment-backend     Up                  0.0.0.0:45000->5000/tcp
recruitment-frontend    Up                  0.0.0.0:43000->80/tcp
```

### 正常的日志输出

**后端日志（无警告）**:
```
Server running on port 5000
Database connection established
Default admin user created
```

**前端日志（无错误）**:
```
Configuration complete; ready for start up
```

### API 测试成功
```bash
# 后端健康检查
curl http://localhost:45000/health
# 应该返回: {"status":"ok","timestamp":"..."}

# 前端健康检查
curl http://localhost:43000/health
# 应该返回: healthy
```

## 📋 检查清单

运行修复脚本后，验证以下项目：

- [ ] 容器全部运行：`docker compose -f docker-compose.working.yml ps`
- [ ] 后端无警告：`docker logs recruitment-backend | grep -v "Ignoring invalid"`
- [ ] 前端无错误：`docker logs recruitment-frontend | grep -v "brotli"`
- [ ] API 可访问：`curl http://localhost:45000/health`
- [ ] 前端可访问：`curl http://localhost:43000`

## 🆘 如果修复失败

### 备用方案1: 使用外部数据库
```bash
./setup-external-mysql.sh
docker compose -f docker-compose.external-db.yml up -d
```

### 备用方案2: 开发模式运行
```bash
# 不使用 Docker，直接运行
cd backend && npm run dev &
cd frontend && npm start &
```

---

**立即执行的修复命令：**
```bash
./immediate-fix.sh
```

这会强制重建所有镜像并应用修复！