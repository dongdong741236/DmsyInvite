# 🚀 服务器部署检查清单

## 部署前准备

### ✅ 服务器要求
- [ ] Ubuntu 20.04+ / CentOS 8+ / Debian 11+
- [ ] 2GB+ RAM (4GB+ 推荐)
- [ ] 20GB+ 可用磁盘空间
- [ ] 稳定的网络连接
- [ ] sudo 权限

### ✅ 端口要求
- [ ] 43000 端口可用 (前端)
- [ ] 45000 端口可用 (后端)
- [ ] 43306 端口可用 (MySQL)
- [ ] 46379 端口可用 (Redis)

## 🔧 部署步骤

### 步骤 1: 获取代码

**方式A: Git 克隆（推荐）**
```bash
# 克隆仓库
git clone <your-repository-url> code-academy-recruitment
cd code-academy-recruitment

# 如果是 PR 分支
git fetch origin pull/<PR-number>/head:<branch-name>
git checkout <branch-name>
```

**方式B: 下载压缩包**
```bash
# 下载并解压
wget <archive-url> -O code-academy.zip
unzip code-academy.zip
cd code-academy-recruitment
```

**方式C: 手动上传**
```bash
# 本地打包
tar -czf code-academy.tar.gz code-academy-recruitment/

# 上传到服务器
scp code-academy.tar.gz user@server:/home/user/

# 服务器解压
tar -xzf code-academy.tar.gz
cd code-academy-recruitment
```

### 步骤 2: 环境准备

```bash
# 首次部署（自动安装 Docker）
./server-setup.sh

# 或手动安装 Docker
sudo apt update
sudo apt install docker.io docker compose-plugin
sudo systemctl start docker
sudo usermod -aG docker $USER
```

### 步骤 3: 配置系统

```bash
# 复制配置模板
cp .env.example .env

# 编辑配置文件
nano .env
```

**必须配置的参数：**
```bash
# 🔐 安全配置
DB_PASSWORD=YourStrongDBPassword123!
REDIS_PASSWORD=YourRedisPassword456!
JWT_SECRET=Your32CharacterRandomJWTSecret

# 📧 邮箱配置
EMAIL_HOST=smtp.your-domain.com
EMAIL_USER=noreply@your-domain.com
EMAIL_PASS=your_email_password
ALLOWED_EMAIL_DOMAIN=@stu.your-university.edu.cn

# 🌐 域名配置（如果有域名）
FRONTEND_URL=https://your-domain.com
REACT_APP_API_URL=https://your-domain.com/api
```

### 步骤 4: 部署服务

```bash
# 快速部署
./quick-deploy.sh

# 或完整部署
./deploy.sh

# 或使用 Make
make prod
```

### 步骤 5: 验证部署

```bash
# 检查服务状态
make health

# 查看容器状态
docker compose ps

# 测试访问
curl http://localhost:45000/health
curl http://localhost:43000
```

## 🌐 公网访问配置

### 防火墙配置

**云服务器安全组：**
- 开放 43000 端口 (前端)
- 开放 45000 端口 (后端)
- 保持 22 端口 (SSH)

**系统防火墙：**
```bash
# Ubuntu/Debian
sudo ufw allow 43000/tcp
sudo ufw allow 45000/tcp
sudo ufw enable

# CentOS/RHEL
sudo firewall-cmd --permanent --add-port=43000/tcp
sudo firewall-cmd --permanent --add-port=45000/tcp
sudo firewall-cmd --reload
```

### 域名配置（可选）

**1. DNS 解析：**
```
A记录: recruitment.your-domain.com → 服务器IP
```

**2. Nginx 反向代理：**
```bash
# 安装 Nginx
sudo apt install nginx

# 创建配置
sudo nano /etc/nginx/sites-available/code-academy
```

配置内容：
```nginx
server {
    listen 80;
    server_name recruitment.your-domain.com;

    location / {
        proxy_pass http://localhost:43000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /api {
        proxy_pass http://localhost:45000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

**3. 启用配置：**
```bash
sudo ln -s /etc/nginx/sites-available/code-academy /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## 📊 部署后检查

### ✅ 服务检查
- [ ] MySQL 容器运行正常
- [ ] Redis 容器运行正常  
- [ ] 后端容器运行正常
- [ ] 前端容器运行正常

### ✅ 功能检查
- [ ] 前端页面可以访问
- [ ] 后端 API 响应正常
- [ ] 用户注册功能正常
- [ ] 邮件发送功能正常
- [ ] 管理员登录正常

### ✅ 性能检查
- [ ] 页面加载速度正常
- [ ] API 响应时间合理
- [ ] 内存使用率正常
- [ ] CPU 使用率正常

## 🔧 常用管理命令

```bash
# 查看服务状态
make health
docker compose ps

# 查看日志
make logs
docker compose logs -f backend

# 重启服务
make restart

# 备份数据
make backup

# 更新代码
git pull
make build
make up

# 清理资源
make clean
```

## 🆘 故障排除

### 端口冲突
```bash
# 检查端口占用
sudo netstat -tlnp | grep :43000
sudo lsof -i :43000

# 停止占用进程
sudo kill -9 <PID>
```

### 服务启动失败
```bash
# 查看详细日志
docker compose logs backend
docker compose logs mysql

# 重新构建
docker compose build --no-cache
```

### 内存不足
```bash
# 检查内存使用
free -h
docker stats

# 增加 swap
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

## 📞 联系支持

如果遇到问题：

1. 检查 `docker compose logs`
2. 查看 `SERVER_DEPLOYMENT.md` 详细文档
3. 确认 `.env` 配置正确
4. 检查服务器资源使用情况

---

**端口映射总览：**
- 前端: `43000` → `80`
- 后端: `45000` → `5000`  
- MySQL: `43306` → `3306`
- Redis: `46379` → `6379`