# 🔧 环境变量修复说明

## 🚨 发现的问题

后端容器尝试连接 `::1:3306`（IPv6 localhost）而不是 `mysql:3306`（容器名），说明环境变量配置有冲突。

## ✅ 解决方案

### 问题根因
`.env` 文件中的 `DB_HOST=mysql` 在容器内被解析为 localhost，覆盖了 docker-compose.yml 中的正确设置。

### 修复方法
在 `.env` 文件中注释掉以下行：
```bash
# DB_HOST=mysql     # 注释掉这行
# REDIS_HOST=redis  # 注释掉这行
```

让 docker-compose.yml 中的环境变量生效：
```yaml
environment:
  DB_HOST: mysql      # 容器名，正确的内网地址
  REDIS_HOST: redis   # 容器名，正确的内网地址
```

## 🔧 立即修复步骤

### 步骤1: 检查当前 .env 文件
```bash
grep -E "DB_HOST|REDIS_HOST" .env
```

### 步骤2: 修复 .env 文件
```bash
# 编辑 .env 文件，注释掉或删除以下行：
# DB_HOST=mysql
# REDIS_HOST=redis

# 或者直接替换
sed -i 's/^DB_HOST=/#DB_HOST=/' .env
sed -i 's/^REDIS_HOST=/#REDIS_HOST=/' .env
```

### 步骤3: 重新部署
```bash
./deploy.sh clean
```

## 📋 正确的 .env 配置

```bash
# Server Configuration
NODE_ENV=production
PORT=5000
FRONTEND_URL=http://localhost:43000

# API Configuration
REACT_APP_API_URL=/api

# Database Configuration (MySQL 8.0)
# DB_HOST=mysql  # ← 这行要注释掉
DB_PORT=3306
DB_NAME=recruitment_db
DB_USER=recruitment_user
DB_PASSWORD=your_secure_password
DB_ROOT_PASSWORD=root_password

# Redis Configuration  
# REDIS_HOST=redis  # ← 这行要注释掉
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here

# Email Configuration
EMAIL_HOST=smtp.your-domain.com
EMAIL_USER=noreply@your-domain.com
EMAIL_PASS=your_email_password
ALLOWED_EMAIL_DOMAIN=@stu.your-university.edu.cn

# Admin Configuration
ADMIN_EMAIL=admin@your-domain.com
ADMIN_PASSWORD=your_admin_password
```

## 🎯 为什么会出现这个问题

1. **环境变量优先级**：`.env` 文件中的变量会覆盖 docker-compose.yml 中的设置
2. **容器网络**：容器内需要使用容器名（如 `mysql`）而不是 `localhost`
3. **IPv6 解析**：某些环境下 `localhost` 会解析为 IPv6 地址 `::1`

## ✅ 修复验证

修复后，后端日志应该显示：
```
info: Database and Redis connections established
info: System configurations initialized  
info: Default admin user created
info: Server running on port 5000
```

而不是：
```
error: connect ECONNREFUSED ::1:3306
```

---

**立即修复命令：**
```bash
# 修复环境变量
sed -i 's/^DB_HOST=/#DB_HOST=/' .env
sed -i 's/^REDIS_HOST=/#REDIS_HOST=/' .env

# 重新部署
./deploy.sh clean
```