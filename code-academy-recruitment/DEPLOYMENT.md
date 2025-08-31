# 部署指南

## 系统要求

- Docker 20.10+
- Docker Compose 2.0+
- 2GB+ 可用内存
- 10GB+ 可用磁盘空间

## 支持的架构

- ARM64 (树莓派4、Apple Silicon Mac等)
- x86_64 (Intel/AMD 处理器)

## 快速部署

### 1. 克隆项目

```bash
git clone <repository-url>
cd code-academy-recruitment
```

### 2. 配置环境变量

```bash
cp .env.example .env
```

编辑 `.env` 文件，修改以下重要配置：

- `DB_PASSWORD`: 数据库密码
- `REDIS_PASSWORD`: Redis密码
- `JWT_SECRET`: JWT密钥（建议使用随机字符串）
- `EMAIL_*`: 邮件服务器配置
- `ALLOWED_EMAIL_DOMAIN`: 允许注册的邮箱后缀
- `ADMIN_PASSWORD`: 默认管理员密码

### 3. 运行部署脚本

```bash
./deploy.sh
```

或手动执行：

```bash
docker-compose up -d
```

### 4. 访问系统

- 前端界面: http://localhost:3000
- 后端API: http://localhost:5000
- 管理员账号: admin@codeacademy.edu.cn

## 生产环境部署

### 使用反向代理

推荐使用 Nginx 作为反向代理：

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /api {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### SSL 证书配置

推荐使用 Let's Encrypt 免费证书：

```bash
certbot --nginx -d yourdomain.com
```

### 数据备份

#### 备份数据库

```bash
docker exec recruitment-postgres pg_dump -U recruitment_user recruitment_db > backup.sql
```

#### 恢复数据库

```bash
docker exec -i recruitment-postgres psql -U recruitment_user recruitment_db < backup.sql
```

## 故障排除

### 查看服务日志

```bash
# 查看所有服务日志
docker-compose logs -f

# 查看特定服务日志
docker-compose logs -f backend
docker-compose logs -f frontend
```

### 重启服务

```bash
# 重启所有服务
docker-compose restart

# 重启特定服务
docker-compose restart backend
```

### 清理和重建

```bash
# 停止并删除容器
docker-compose down

# 清理数据卷（注意：会删除所有数据）
docker-compose down -v

# 重新构建镜像
docker-compose build --no-cache
```

## 性能优化

### 数据库优化

编辑 `docker-compose.yml`，添加 PostgreSQL 优化参数：

```yaml
postgres:
  command: 
    - postgres
    - -c
    - shared_buffers=256MB
    - -c
    - max_connections=200
```

### Redis 持久化

确保 Redis 数据持久化：

```yaml
redis:
  command: redis-server --appendonly yes --requirepass ${REDIS_PASSWORD}
```

## 监控

### 使用 Docker 统计信息

```bash
docker stats
```

### 健康检查

```bash
curl http://localhost:5000/health
curl http://localhost:3000/health
```

## 安全建议

1. 修改默认密码
2. 限制数据库端口访问
3. 使用 HTTPS
4. 定期更新依赖
5. 配置防火墙规则
6. 定期备份数据

## 更新系统

```bash
# 拉取最新代码
git pull

# 重新构建和部署
docker-compose build
docker-compose up -d
```