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
- **数据库**: MySQL 8.0
- **缓存**: Redis
- **邮件服务**: Nodemailer
- **容器化**: Docker + Docker Compose

## 快速开始

### 方式1: 最终部署脚本（推荐，已修复所有问题）

```bash
# 1. 克隆项目
git clone <repository-url>
cd code-academy-recruitment

# 2. 一键部署（包含环境检查、编译测试、构建部署）
./final-deploy.sh
```

### 方式2: 自动安装部署

```bash
# 1. 克隆项目
git clone <repository-url>
cd code-academy-recruitment

# 2. 检查环境
./check-env.sh

# 3. 自动部署（包含 Docker 安装）
./server-setup.sh
```

### 方式3: 快速部署（已有 Docker 环境）

```bash
# 1. 克隆项目
git clone <repository-url>
cd code-academy-recruitment

# 2. 配置环境
cp .env.example .env
nano .env  # 编辑必要配置

# 3. 快速部署
./quick-deploy.sh
```

### 方式4: 手动部署

```bash
# 1. 克隆项目
git clone <repository-url>
cd code-academy-recruitment

# 2. 配置环境
cp .env.example .env
nano .env

# 3. 启动服务
docker compose up -d
```

访问地址：
- 前端：http://localhost:43000
- 后端API：http://localhost:45000
- MySQL：localhost:43306
- Redis：localhost:46379

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