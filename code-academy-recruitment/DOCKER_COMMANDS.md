# Docker Compose 命令参考

## 🐳 使用 Docker Compose V2

本项目使用 `docker compose`（V2 版本）命令，而不是旧版的 `docker-compose`。

### 版本区别

| 旧版本 | 新版本 |
|--------|--------|
| `docker-compose` | `docker compose` |
| 独立安装 | Docker Desktop 内置 |
| Python 实现 | Go 实现，性能更好 |

## 📋 常用命令

### 基础操作

```bash
# 启动所有服务（后台运行）
docker compose up -d

# 启动所有服务（前台运行，可看日志）
docker compose up

# 停止所有服务
docker compose down

# 停止并删除数据卷（⚠️ 会删除数据）
docker compose down -v

# 重启所有服务
docker compose restart

# 重启特定服务
docker compose restart backend
```

### 构建和更新

```bash
# 构建所有镜像
docker compose build

# 强制重新构建（不使用缓存）
docker compose build --no-cache

# 构建特定服务
docker compose build backend

# 拉取最新镜像
docker compose pull
```

### 查看状态

```bash
# 查看服务状态
docker compose ps

# 查看详细状态
docker compose ps -a

# 查看服务配置
docker compose config

# 查看服务日志
docker compose logs

# 实时查看日志
docker compose logs -f

# 查看特定服务日志
docker compose logs -f backend
```

### 服务管理

```bash
# 启动特定服务
docker compose up -d mysql

# 停止特定服务
docker compose stop backend

# 删除特定服务容器
docker compose rm backend

# 扩展服务实例（如果支持）
docker compose up -d --scale backend=2
```

### 执行命令

```bash
# 在运行的容器中执行命令
docker compose exec backend bash
docker compose exec mysql mysql -u root -p

# 在新容器中执行一次性命令
docker compose run --rm backend npm run test

# 查看容器资源使用
docker stats
```

## 🎯 项目特定命令

### 架构相关

```bash
# 自动检测架构部署
make prod

# 强制使用 x86 配置
docker compose -f docker-compose.yml up -d

# 强制使用 ARM 配置
docker compose -f docker-compose.arm.yml up -d
```

### 数据库操作

```bash
# 连接 MySQL
docker compose exec mysql mysql -u recruitment_user -p

# 备份数据库
docker compose exec mysql mysqldump -u recruitment_user -p recruitment_db > backup.sql

# 恢复数据库
docker compose exec -T mysql mysql -u recruitment_user -p recruitment_db < backup.sql

# 查看数据库状态
docker compose exec mysql mysqladmin status -u recruitment_user -p
```

### 开发调试

```bash
# 查看后端日志
docker compose logs -f backend

# 进入后端容器
docker compose exec backend sh

# 重新构建并启动后端
docker compose up -d --build backend

# 查看环境变量
docker compose exec backend env
```

## 🔧 配置文件

### 使用不同的配置文件

```bash
# 使用特定配置文件
docker compose -f docker-compose.yml up -d

# 使用多个配置文件（合并）
docker compose -f docker-compose.yml -f docker-compose.override.yml up -d

# 指定环境变量文件
docker compose --env-file .env.production up -d
```

### 环境变量

```bash
# 查看当前配置
docker compose config

# 验证配置文件语法
docker compose config --quiet

# 查看解析后的配置
docker compose config --services
```

## 🚀 生产环境命令

### 部署

```bash
# 生产环境部署
docker compose -f docker-compose.yml up -d

# 更新服务（无停机）
docker compose up -d --no-deps backend

# 滚动更新
docker compose up -d --force-recreate --no-deps backend
```

### 监控

```bash
# 查看容器状态
docker compose ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}"

# 查看资源使用
docker stats $(docker compose ps -q)

# 查看网络
docker compose ls
docker network ls
```

### 备份和恢复

```bash
# 完整备份
docker compose exec mysql mysqldump -u recruitment_user -p --all-databases > full_backup.sql

# 增量备份（如果启用了 binlog）
docker compose exec mysql mysqlbinlog /var/lib/mysql/mysql-bin.000001 > incremental.sql

# 恢复数据
docker compose exec -T mysql mysql -u root -p < backup.sql
```

## 📊 性能优化

### 资源限制

在 docker-compose.yml 中添加：

```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: '0.5'
        reservations:
          memory: 256M
```

### 健康检查

```bash
# 查看健康状态
docker compose ps --format "table {{.Name}}\t{{.Status}}\t{{.Health}}"

# 手动执行健康检查
docker compose exec mysql mysqladmin ping
```

## 🆘 故障排除

### 常见问题

```bash
# 端口冲突
docker compose down
sudo netstat -tlnp | grep :43000

# 权限问题
sudo chown -R $USER:$USER .
sudo usermod -aG docker $USER

# 镜像问题
docker compose build --no-cache
docker system prune -a

# 网络问题
docker network prune
docker compose down && docker compose up -d
```

### 调试技巧

```bash
# 查看完整错误信息
docker compose logs --no-log-prefix backend

# 查看容器启动过程
docker compose up backend

# 检查配置文件
docker compose config --quiet && echo "配置文件正确" || echo "配置文件有错误"
```

---

**快速参考：**
- 启动: `docker compose up -d`
- 停止: `docker compose down`
- 日志: `docker compose logs -f`
- 状态: `docker compose ps`
- 重启: `docker compose restart`