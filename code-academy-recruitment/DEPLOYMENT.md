# 🚀 部署指南

## 系统要求

- Docker 20.10+
- Docker Compose V2
- 2GB+ 内存
- 10GB+ 磁盘空间

## 快速部署

### 1. 获取代码

```bash
# Git 克隆
git clone <repository-url> code-academy-recruitment
cd code-academy-recruitment

# 或者 PR 分支
git fetch origin pull/<PR-number>/head:pr-branch
git checkout pr-branch
```

### 2. 配置环境

```bash
# 复制配置模板
cp .env.example .env

# 编辑配置文件
nano .env
```

**必须配置的参数：**
- `DB_PASSWORD` - 数据库密码
- `REDIS_PASSWORD` - Redis密码
- `JWT_SECRET` - JWT密钥（32位随机字符串）
- `EMAIL_*` - 邮箱服务器配置
- `ALLOWED_EMAIL_DOMAIN` - 允许注册的邮箱后缀

### 3. 一键部署

```bash
# 首次部署
./deploy.sh install

# 或使用 Make
make install
```

## 📋 管理命令

### 基础操作

```bash
./deploy.sh install     # 首次部署
./deploy.sh update      # 更新代码
./deploy.sh restart     # 重启服务
./deploy.sh stop        # 停止服务
./deploy.sh status      # 查看状态
./deploy.sh logs        # 查看日志
./deploy.sh clean       # 清理重建
```

### Make 命令

```bash
make install           # 首次部署
make update           # 更新代码
make restart          # 重启服务
make status           # 查看状态
make logs             # 查看日志
make health           # 健康检查
make backup           # 备份数据库
```

## 🌐 访问地址

- **前端**: http://localhost:43000
- **后端**: http://localhost:45000
- **MySQL**: localhost:43306
- **Redis**: localhost:46379

## 📧 邮箱配置

系统使用邮箱验证码注册，需要配置 SMTP 服务器：

```bash
EMAIL_HOST=smtp.your-domain.com
EMAIL_PORT=587
EMAIL_USER=noreply@your-domain.com
EMAIL_PASS=your_email_password
EMAIL_FROM=代码书院 <noreply@your-domain.com>
```

## 🔧 故障排除

### 服务异常

```bash
# 查看详细状态
./deploy.sh status

# 查看错误日志
./deploy.sh logs

# 重启服务
./deploy.sh restart
```

### 完全重置（推荐）

```bash
# 清理并重新部署（适用于所有更新和问题修复）
./deploy.sh clean
```

**注意**：`./deploy.sh clean` 是推荐的部署方式，会：
- 停止所有服务
- 删除旧镜像
- 清理 Docker 缓存
- 重新构建所有镜像
- 启动服务并进行健康检查

### 数据备份

```bash
# 备份数据库
make backup

# 查看备份文件
ls backups/
```

## 🏗️ 架构支持

- **x86_64**: 自动使用标准配置
- **ARM64**: 自动使用 ARM 优化配置
- **多架构**: 自动检测并选择最优配置

## 📱 更新流程

```bash
# 拉取最新代码并更新
git pull
./deploy.sh update

# 或一条命令
make update
```

## 🆘 获取帮助

```bash
# 查看帮助
./deploy.sh help

# 检查系统状态
make health

# 测试邮箱功能
./test-email-verification.sh
```