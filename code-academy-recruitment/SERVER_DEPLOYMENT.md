# 服务器部署完整指南

## 🚀 快速部署步骤

### 1. 服务器准备

**系统要求：**
- Ubuntu 20.04+ / CentOS 8+ / Debian 11+
- 2GB+ RAM (4GB+ 推荐)
- 20GB+ 可用磁盘空间
- Docker 20.10+ 和 Docker Compose 2.0+

### 2. 拉取代码

```bash
# 方式1: 从 Git 仓库克隆（推荐）
git clone <your-repository-url> code-academy-recruitment
cd code-academy-recruitment

# 方式2: 如果是 PR，拉取特定分支
git clone -b <branch-name> <your-repository-url> code-academy-recruitment
cd code-academy-recruitment

# 方式3: 下载压缩包
wget <repository-archive-url> -O code-academy.zip
unzip code-academy.zip
cd code-academy-recruitment
```

### 3. 环境配置

```bash
# 复制环境变量模板
cp .env.example .env

# 编辑配置文件
nano .env  # 或使用 vim .env
```

**必须修改的配置项：**
```bash
# 数据库密码（必须修改）
DB_PASSWORD=your_strong_password_here
DB_ROOT_PASSWORD=your_root_password_here

# Redis 密码（必须修改）
REDIS_PASSWORD=your_redis_password_here

# JWT 密钥（必须修改，建议32位随机字符串）
JWT_SECRET=your_32_character_jwt_secret_key

# 邮箱配置（必须配置）
EMAIL_HOST=smtp.your-domain.com
EMAIL_PORT=587
EMAIL_USER=noreply@your-domain.com
EMAIL_PASS=your_email_password
EMAIL_FROM=代码书院 <noreply@your-domain.com>

# 允许的邮箱后缀（修改为您的学校域名）
ALLOWED_EMAIL_DOMAIN=@stu.your-university.edu.cn

# 管理员账号（可选修改）
ADMIN_EMAIL=admin@your-domain.com
ADMIN_PASSWORD=your_admin_password
```

### 4. 一键部署

```bash
# 给脚本执行权限
chmod +x deploy.sh

# 执行部署
./deploy.sh
```

## 📋 详细部署步骤

### 步骤1：安装 Docker

**Ubuntu/Debian:**
```bash
# 更新包列表
sudo apt update

# 安装依赖
sudo apt install -y apt-transport-https ca-certificates curl gnupg lsb-release

# 添加 Docker 官方 GPG 密钥
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# 添加 Docker 仓库
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# 安装 Docker
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# 启动 Docker
sudo systemctl start docker
sudo systemctl enable docker

# 添加用户到 docker 组
sudo usermod -aG docker $USER
```

**CentOS/RHEL:**
```bash
# 安装 Docker
sudo yum install -y yum-utils
sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
sudo yum install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# 启动 Docker
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker $USER
```

### 步骤2：配置防火墙

```bash
# Ubuntu/Debian (UFW)
sudo ufw allow 43000/tcp  # 前端
sudo ufw allow 45000/tcp  # 后端
sudo ufw allow 22/tcp     # SSH
sudo ufw enable

# CentOS/RHEL (firewalld)
sudo firewall-cmd --permanent --add-port=43000/tcp
sudo firewall-cmd --permanent --add-port=45000/tcp
sudo firewall-cmd --reload

# 或者直接使用 iptables
sudo iptables -A INPUT -p tcp --dport 43000 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 45000 -j ACCEPT
sudo iptables-save | sudo tee /etc/iptables/rules.v4
```

### 步骤3：获取代码

**如果您有 Git 仓库：**
```bash
# 克隆仓库
git clone https://github.com/your-username/code-academy-recruitment.git
cd code-academy-recruitment

# 如果是私有仓库，需要配置 SSH 密钥或使用 HTTPS 认证
```

**如果是 PR 或特定分支：**
```bash
# 拉取特定分支
git clone -b feature-branch https://github.com/your-username/code-academy-recruitment.git

# 或者在现有仓库中切换分支
git fetch origin
git checkout feature-branch
git pull origin feature-branch
```

**如果没有 Git 仓库，手动上传：**
```bash
# 在本地打包代码
tar -czf code-academy-recruitment.tar.gz code-academy-recruitment/

# 上传到服务器
scp code-academy-recruitment.tar.gz user@your-server:/home/user/

# 在服务器上解压
ssh user@your-server
cd /home/user
tar -xzf code-academy-recruitment.tar.gz
cd code-academy-recruitment
```

### 步骤4：环境配置详解

创建并编辑 `.env` 文件：

```bash
cp .env.example .env
nano .env
```

**完整配置示例：**
```bash
# 服务器配置
NODE_ENV=production
PORT=5000
FRONTEND_URL=http://your-domain.com:43000

# 数据库配置
DB_HOST=mysql
DB_PORT=3306
DB_NAME=recruitment_db
DB_USER=recruitment_user
DB_PASSWORD=StrongPassword123!
DB_ROOT_PASSWORD=RootPassword456!

# MySQL 8.0 特定配置
MYSQL_CHARSET=utf8mb4
MYSQL_COLLATION=utf8mb4_unicode_ci

# Redis 配置
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=RedisPassword789!

# JWT 配置
JWT_SECRET=your_32_character_random_jwt_secret
JWT_EXPIRES_IN=7d

# 邮箱配置
EMAIL_HOST=smtp.exmail.qq.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=noreply@your-university.edu.cn
EMAIL_PASS=your_email_password
EMAIL_FROM=代码书院实验室 <noreply@your-university.edu.cn>

# 邮箱域名限制
ALLOWED_EMAIL_DOMAIN=@stu.your-university.edu.cn

# 管理员配置
ADMIN_EMAIL=admin@your-university.edu.cn
ADMIN_PASSWORD=AdminPassword123!

# API URL配置
REACT_APP_API_URL=http://your-domain.com:45000/api
```

### 步骤5：部署执行

```bash
# 方式1：使用部署脚本（推荐）
./deploy.sh

# 方式2：使用 Make 命令
make prod

# 方式3：手动执行
docker-compose up -d
```

## 🌐 域名和反向代理配置

### 使用 Nginx 反向代理

**安装 Nginx：**
```bash
sudo apt install nginx  # Ubuntu/Debian
sudo yum install nginx  # CentOS/RHEL
```

**创建配置文件：**
```bash
sudo nano /etc/nginx/sites-available/code-academy
```

**Nginx 配置内容：**
```nginx
server {
    listen 80;
    server_name your-domain.com;

    # 前端代理
    location / {
        proxy_pass http://localhost:43000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # 后端 API 代理
    location /api {
        proxy_pass http://localhost:45000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # 增加超时时间
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # 静态文件缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        proxy_pass http://localhost:43000;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

**启用配置：**
```bash
sudo ln -s /etc/nginx/sites-available/code-academy /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### SSL 证书配置

**使用 Let's Encrypt：**
```bash
# 安装 Certbot
sudo apt install certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d your-domain.com

# 自动续期
sudo crontab -e
# 添加：0 12 * * * /usr/bin/certbot renew --quiet
```

## 🔧 生产环境优化

### 系统级优化

```bash
# 增加文件描述符限制
echo "* soft nofile 65536" | sudo tee -a /etc/security/limits.conf
echo "* hard nofile 65536" | sudo tee -a /etc/security/limits.conf

# 内核参数优化
echo "net.core.somaxconn = 65535" | sudo tee -a /etc/sysctl.conf
echo "net.ipv4.tcp_max_syn_backlog = 65535" | sudo tee -a /etc/sysctl.conf
sudo sysctl -p

# 禁用 swap（如果内存充足）
sudo swapoff -a
```

### Docker 优化

```bash
# 配置 Docker daemon
sudo tee /etc/docker/daemon.json > /dev/null <<EOF
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  },
  "storage-driver": "overlay2"
}
EOF

sudo systemctl restart docker
```

## 📊 监控和维护

### 服务监控

```bash
# 查看服务状态
make health
docker-compose ps

# 查看资源使用
docker stats

# 查看日志
make logs
docker-compose logs -f backend
```

### 定期维护

```bash
# 数据库备份（每天执行）
make backup

# 清理 Docker 资源（每周执行）
docker system prune -f

# 更新系统
git pull
make build
make up
```

### 自动化脚本

**创建系统服务：**
```bash
sudo tee /etc/systemd/system/code-academy.service > /dev/null <<EOF
[Unit]
Description=Code Academy Recruitment System
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/path/to/code-academy-recruitment
ExecStart=/usr/local/bin/docker-compose up -d
ExecStop=/usr/local/bin/docker-compose down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl enable code-academy.service
sudo systemctl start code-academy.service
```

## 🔒 安全配置

### 基础安全

```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 配置 SSH（如果需要）
sudo sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
sudo systemctl restart ssh

# 安装 fail2ban
sudo apt install fail2ban
sudo systemctl enable fail2ban
```

### 应用安全

1. **修改默认密码**
2. **配置强密码策略**
3. **启用 HTTPS**
4. **限制数据库访问**
5. **定期更新依赖**

## 📞 端口配置说明

### 新端口映射

| 服务 | 内部端口 | 外部端口 | 用途 |
|------|----------|----------|------|
| 前端 | 80 | **43000** | Web 界面 |
| 后端 | 5000 | **45000** | API 服务 |
| MySQL | 3306 | **43306** | 数据库 |
| Redis | 6379 | **46379** | 缓存 |

### 访问地址

- **前端界面**: http://your-server-ip:43000
- **后端 API**: http://your-server-ip:45000
- **MySQL 数据库**: your-server-ip:43306
- **Redis 缓存**: your-server-ip:46379

## 🐛 常见问题解决

### 1. 端口被占用

```bash
# 检查端口占用
sudo netstat -tlnp | grep :43000
sudo lsof -i :43000

# 停止占用进程
sudo kill -9 <PID>
```

### 2. 权限问题

```bash
# 确保用户在 docker 组中
sudo usermod -aG docker $USER
newgrp docker

# 重新登录或执行
su - $USER
```

### 3. 内存不足

```bash
# 检查内存使用
free -h
docker stats

# 增加 swap
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

### 4. 磁盘空间不足

```bash
# 清理 Docker 资源
docker system prune -a
docker volume prune

# 清理系统日志
sudo journalctl --vacuum-time=7d
```

## 🔄 更新和维护

### 代码更新

```bash
# 拉取最新代码
git pull origin main

# 重新构建和部署
make clean
make build
make up
```

### 数据备份

```bash
# 手动备份
make backup

# 设置定时备份
crontab -e
# 添加：0 2 * * * cd /path/to/code-academy-recruitment && make backup
```

### 日志管理

```bash
# 查看应用日志
make logs

# 查看系统日志
sudo journalctl -u docker
sudo journalctl -f
```

## 🌍 公网访问配置

### 1. 域名解析

在您的 DNS 提供商处添加 A 记录：
```
recruitment.your-domain.com  →  your-server-ip
```

### 2. 更新环境变量

```bash
# 编辑 .env 文件
FRONTEND_URL=https://recruitment.your-domain.com
REACT_APP_API_URL=https://recruitment.your-domain.com/api
```

### 3. Nginx 配置

使用上面提供的 Nginx 配置，并配置 SSL 证书。

## 📱 移动端访问

系统已适配移动端访问，通过以下地址访问：
- **桌面端**: http://your-domain.com:43000
- **移动端**: 同上（响应式设计）

## 🎯 部署验证

部署完成后，访问以下地址验证：

1. **前端界面**: http://your-server-ip:43000
2. **API 健康检查**: http://your-server-ip:45000/health
3. **管理员登录**: 使用配置的管理员账号登录

## 📞 技术支持

如果遇到问题，请检查：

1. **服务状态**: `docker-compose ps`
2. **服务日志**: `make logs`
3. **系统资源**: `htop` 或 `docker stats`
4. **网络连接**: `curl http://localhost:45000/health`

---

**快速命令参考：**
```bash
# 部署
./deploy.sh

# 查看状态
make health

# 查看日志
make logs

# 备份数据
make backup

# 重启服务
make restart
```