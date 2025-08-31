# 🚀 快速开始指南

## 最简部署流程

### 1️⃣ 获取代码

```bash
# 克隆仓库
git clone <your-repository-url> code-academy-recruitment
cd code-academy-recruitment

# 如果是 PR 代码
git fetch origin pull/<PR-number>/head:pr-branch
git checkout pr-branch
```

### 2️⃣ 环境检查

```bash
# 检查部署环境
./check-env.sh
```

如果环境检查失败，运行：
```bash
./server-setup.sh
```

### 3️⃣ 配置系统

```bash
# 复制配置模板
cp .env.example .env

# 编辑配置（必须修改以下项目）
nano .env
```

**必须修改的配置：**
```bash
# 数据库密码
DB_PASSWORD=your_strong_password

# Redis 密码  
REDIS_PASSWORD=your_redis_password

# JWT 密钥（32位随机字符串）
JWT_SECRET=your_32_character_jwt_secret

# 邮箱配置
EMAIL_HOST=smtp.your-domain.com
EMAIL_USER=noreply@your-domain.com
EMAIL_PASS=your_email_password

# 学校邮箱后缀
ALLOWED_EMAIL_DOMAIN=@stu.your-university.edu.cn
```

### 4️⃣ 一键部署

```bash
# 快速部署
./quick-deploy.sh
```

### 5️⃣ 验证部署

```bash
# 检查服务状态
docker compose ps

# 访问系统
curl http://localhost:45000/health  # 后端健康检查
curl http://localhost:43000         # 前端页面
```

## 🌐 访问地址

- **前端界面**: http://your-server-ip:43000
- **后端 API**: http://your-server-ip:45000
- **管理后台**: http://your-server-ip:43000/admin

## 👤 默认管理员账号

- **邮箱**: 查看 `.env` 文件中的 `ADMIN_EMAIL`
- **密码**: 查看 `.env` 文件中的 `ADMIN_PASSWORD`

## 📋 常用命令

```bash
# 查看服务状态
docker compose ps

# 查看日志
docker compose logs -f

# 重启服务
docker compose restart

# 停止服务
docker compose down

# 备份数据
make backup

# 更新代码
git pull && docker compose build && docker compose up -d
```

## 🆘 遇到问题？

1. **检查环境**: `./check-env.sh`
2. **查看日志**: `docker compose logs`
3. **查看文档**: `cat TROUBLESHOOTING.md`
4. **重置系统**: `docker compose down -v && docker compose up -d`

---

**一行命令部署：**
```bash
git clone <repo-url> app && cd app && cp .env.example .env && nano .env && ./quick-deploy.sh
```