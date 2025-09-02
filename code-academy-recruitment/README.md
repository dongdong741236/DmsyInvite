# 代码书院实验室纳新系统

一个基于前后端分离架构的实验室招新管理系统，支持ARM架构Docker一键部署。

## 功能特性

### 前台功能
- 校内邮箱验证码注册/登录
- 申请表单填写
- 申请状态查询
- 面试结果查看

### 后台功能
- 用户信息管理
- 申请审核
- 面试教室分配
- 面试记录管理
- 邮件通知发送

## 技术栈

- **前端**: React + TypeScript + Tailwind CSS（新拟态设计）
- **后端**: Node.js + Express + TypeScript
- **数据库**: MySQL 8.0
- **缓存**: Redis
- **邮件服务**: Nodemailer
- **容器化**: Docker + Docker Compose

## 🚀 快速开始

### 方法1: 一键部署（推荐）

```bash
# 1. 克隆项目
git clone <repository-url> code-academy-recruitment
cd code-academy-recruitment

# 2. 首次部署
./deploy.sh install
```

### 方法2: 使用 Make 命令

```bash
# 首次安装
make install

# 更新代码
make update

# 重启服务
make restart
```

## ⚙️ 配置要求

复制环境变量模板并配置：

```bash
cp .env.example .env
nano .env
```

**必须配置的参数：**
```bash
# 数据库密码
DB_PASSWORD=your_strong_password
DB_ROOT_PASSWORD=your_root_password

# Redis 密码
REDIS_PASSWORD=your_redis_password

# JWT 密钥
JWT_SECRET=your_32_character_jwt_secret

# 邮箱配置（用于验证码）
EMAIL_HOST=smtp.your-domain.com
EMAIL_USER=noreply@your-domain.com
EMAIL_PASS=your_email_password

# 允许的邮箱域名
ALLOWED_EMAIL_DOMAIN=@stu.your-university.edu.cn
```

## 🌐 访问地址

- **前端界面**: http://localhost:43000
- **后端API**: http://localhost:45000
- **MySQL数据库**: localhost:43306
- **Redis缓存**: localhost:46379

## 📧 邮箱验证码注册

系统采用邮箱验证码注册方式：

1. **输入邮箱** → 系统发送6位验证码
2. **输入验证码** → 验证邮箱所有权
3. **填写信息** → 完成注册

验证码有效期10分钟，最多尝试5次。

## 📋 管理命令

### 主要部署命令
```bash
./deploy.sh install     # 首次部署
./deploy.sh update      # 更新代码
./deploy.sh clean       # 清理重建（推荐用于重大更新）
```

### 日常管理命令
```bash
./deploy.sh restart     # 重启服务
./deploy.sh status      # 查看状态
./deploy.sh logs        # 查看日志
./deploy.sh stop        # 停止服务
```

### 辅助命令
```bash
make health            # 健康检查
make backup            # 备份数据库
```

**推荐**：遇到任何问题或更新代码时，直接使用 `./deploy.sh clean` 进行完整重新部署。

## 🔧 故障排除

### 常见问题

1. **端口被占用**
```bash
sudo netstat -tlnp | grep :43000
sudo kill -9 <PID>
```

2. **服务启动失败**
```bash
./deploy.sh logs
./deploy.sh restart
```

3. **邮件发送失败**
```bash
# 检查邮箱配置
grep EMAIL_ .env

# 测试邮箱验证码功能
./test-email-verification.sh
```

4. **数据库连接失败**
```bash
docker exec recruitment-mysql mysqladmin ping
./deploy.sh clean  # 重新构建
```

## 🏗️ 架构说明

### 网络架构
```
浏览器 → Nginx (43000) → React 应用
              ↓ /api/*
         Backend (45000) ← Node.js API
              ↓
         MySQL (43306) + Redis (46379)
```

### 容器架构
- **recruitment-frontend**: Nginx + React 构建文件
- **recruitment-backend**: Node.js + Express API
- **recruitment-mysql**: MySQL 8.0 数据库
- **recruitment-redis**: Redis 缓存服务

## 📱 支持的架构

- **x86_64**: Intel/AMD 处理器
- **ARM64**: Apple Silicon、树莓派4、AWS Graviton
- **自动检测**: 脚本自动选择最优配置

## 📞 技术支持

如果遇到问题：

1. 查看日志：`./deploy.sh logs`
2. 检查状态：`./deploy.sh status`
3. 健康检查：`make health`
4. 重新部署：`./deploy.sh clean`

## License

MIT