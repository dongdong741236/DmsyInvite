# 📋 项目总结

## 🎯 项目概述

代码书院实验室纳新系统是一个现代化的前后端分离Web应用，专为高校实验室招新设计。

## ✨ 核心特性

### 🔐 邮箱验证码注册
- 6位数验证码，10分钟有效期
- 防暴力破解（最多5次尝试）
- 校内邮箱域名限制
- 三步骤注册流程

### 🎨 新拟态设计
- 蓝白色调，简洁大方
- 响应式布局
- 现代化用户体验
- Tailwind CSS 实现

### 🏗️ 技术架构
- **前端**: React + TypeScript + Tailwind CSS
- **后端**: Node.js + Express + TypeScript
- **数据库**: MySQL 8.0 + Redis
- **部署**: Docker + Docker Compose
- **架构**: 支持 x86_64 和 ARM64

## 📦 项目结构

```
code-academy-recruitment/
├── deploy.sh                    # 统一部署脚本
├── Makefile                     # Make 命令支持
├── docker-compose.yml           # 主配置文件
├── docker-compose.arm.yml       # ARM 优化配置
├── .env.example                 # 环境变量模板
├── backend/                     # 后端代码
│   ├── src/                     # 源代码
│   ├── Dockerfile               # 后端镜像构建
│   └── package.json             # 依赖配置
├── frontend/                    # 前端代码
│   ├── src/                     # 源代码
│   ├── Dockerfile               # 前端镜像构建
│   ├── nginx-simple.conf        # Nginx 配置
│   └── package.json             # 依赖配置
├── docker/                      # Docker 配置
│   └── mysql/                   # MySQL 配置文件
└── 文档文件...
```

## 🚀 部署方式

### 一键部署
```bash
./deploy.sh install
```

### 代码更新
```bash
./deploy.sh update
```

### 服务管理
```bash
./deploy.sh restart    # 重启
./deploy.sh status     # 状态
./deploy.sh logs       # 日志
```

## 🌐 访问地址

- **前端**: http://localhost:43000
- **后端**: http://localhost:45000
- **数据库**: localhost:43306
- **缓存**: localhost:46379

## 🔧 配置要求

### 必须配置项
```bash
DB_PASSWORD=your_strong_password
REDIS_PASSWORD=your_redis_password
JWT_SECRET=your_32_character_secret
EMAIL_HOST=smtp.your-domain.com
EMAIL_USER=noreply@your-domain.com
EMAIL_PASS=your_email_password
ALLOWED_EMAIL_DOMAIN=@stu.your-university.edu.cn
```

## 📱 支持的平台

- **Ubuntu/Debian** - 完全支持
- **CentOS/RHEL** - 完全支持
- **ARM64 设备** - 树莓派、Apple Silicon
- **云服务器** - AWS、阿里云、腾讯云

## 🎯 用户流程

### 学生用户
1. 邮箱验证码注册
2. 填写申请表单
3. 查看申请状态
4. 接收面试通知
5. 查看录取结果

### 管理员
1. 审核申请材料
2. 安排面试时间地点
3. 记录面试评分
4. 发送录取通知

## 📊 系统优势

- ✅ **一键部署** - Docker 容器化，支持多架构
- ✅ **安全可靠** - 邮箱验证、JWT认证、数据加密
- ✅ **性能优秀** - Redis缓存、Nginx代理、优化配置
- ✅ **易于维护** - 统一脚本、详细日志、健康检查
- ✅ **用户友好** - 现代UI、响应式设计、流程清晰

## 📞 技术支持

### 常用命令
```bash
./deploy.sh help       # 查看帮助
make health           # 健康检查
make backup           # 数据备份
```

### 故障排除
1. 查看日志：`./deploy.sh logs`
2. 重启服务：`./deploy.sh restart`
3. 清理重建：`./deploy.sh clean`

### 文档参考
- `README.md` - 项目介绍和快速开始
- `DEPLOYMENT.md` - 详细部署指南
- `EMAIL_VERIFICATION.md` - 邮箱验证功能说明
- `API.md` - API 接口文档

---

**快速开始命令：**
```bash
git clone <repo> && cd code-academy-recruitment && ./deploy.sh install
```