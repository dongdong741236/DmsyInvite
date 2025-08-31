# 代码书院实验室纳新系统

一个基于前后端分离架构的实验室招新管理系统，支持ARM架构Docker一键部署。

## 功能特性

### 前台功能
- 校内邮箱注册/登录（指定邮箱后缀验证）
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
- **数据库**: PostgreSQL
- **缓存**: Redis
- **邮件服务**: Nodemailer
- **容器化**: Docker + Docker Compose

## 快速开始

### 使用Docker一键部署

```bash
# 克隆项目
git clone <repository-url>

# 进入项目目录
cd code-academy-recruitment

# 启动服务
docker-compose up -d
```

访问地址：
- 前端：http://localhost:3000
- 后端API：http://localhost:5000

## 环境配置

复制环境变量模板并配置：

```bash
cp .env.example .env
```

主要配置项：
- 数据库连接信息
- 邮件服务器配置
- JWT密钥
- 允许的邮箱后缀

## 开发指南

### 前端开发

```bash
cd frontend
npm install
npm run dev
```

### 后端开发

```bash
cd backend
npm install
npm run dev
```

## 部署说明

本系统支持ARM架构（如树莓派、Apple Silicon等）和x86架构的Docker部署。

## License

MIT