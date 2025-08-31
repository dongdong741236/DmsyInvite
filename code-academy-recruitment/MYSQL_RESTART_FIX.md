# 🔧 MySQL 重启循环问题修复指南

## 🚨 问题分析

您遇到的 MySQL 容器重启循环问题，常见原因：

1. **初始化脚本问题** - 自定义脚本导致启动失败
2. **内存限制冲突** - 内核不支持 swap limit capabilities  
3. **权限问题** - 数据卷权限或用户权限
4. **配置参数冲突** - MySQL 启动参数不兼容

## ✅ 解决方案（按优先级）

### 方案1: 使用修复脚本（推荐）

```bash
# 停止现有服务
docker compose down

# 运行 MySQL 修复脚本
./fix-mysql-restart.sh
```

这个脚本会：
- 清理所有现有容器
- 可选择重置数据卷
- 使用最小化配置启动
- 分步监控启动过程

### 方案2: 使用纯净配置

```bash
# 使用无自定义脚本的配置
docker compose -f docker-compose.clean.yml up -d
```

纯净配置特点：
- ✅ 无自定义初始化脚本
- ✅ 无内存限制配置
- ✅ 更长的健康检查等待时间
- ✅ 基础的 MySQL 启动参数

### 方案3: 测试 MySQL 兼容性

```bash
# 运行 MySQL 独立测试
./test-mysql.sh
```

这会：
- 测试基础 MySQL 容器
- 测试带配置的 MySQL
- 提供详细的错误诊断

### 方案4: 使用外部 MySQL（应急方案）

```bash
# 安装本地 MySQL
./setup-external-mysql.sh

# 使用外部数据库配置
docker compose -f docker-compose.external-db.yml up -d
```

## 🔍 手动诊断步骤

### 1. 检查当前状态

```bash
# 查看容器状态
docker ps -a --filter "name=recruitment-mysql"

# 查看详细日志
docker logs recruitment-mysql

# 查看实时日志
docker logs -f recruitment-mysql
```

### 2. 检查系统资源

```bash
# 检查磁盘空间
df -h

# 检查内存
free -h

# 检查 Docker 空间
docker system df
```

### 3. 检查端口和网络

```bash
# 检查端口占用
sudo netstat -tlnp | grep :43306

# 检查 Docker 网络
docker network ls
```

### 4. 重置数据卷

```bash
# 完全重置（会丢失数据）
docker compose down -v
docker volume rm code-academy-recruitment_mysql_data
```

## 🛠️ 常见修复方法

### 修复1: 权限问题

```bash
# 检查 Docker 卷权限
sudo ls -la /var/lib/docker/volumes/

# 重置卷权限
docker volume rm code-academy-recruitment_mysql_data
```

### 修复2: 配置冲突

```bash
# 使用最基础的 MySQL 配置
docker run -d --name mysql-basic \
  -e MYSQL_ROOT_PASSWORD=root123 \
  -e MYSQL_DATABASE=recruitment_db \
  -p 43306:3306 \
  mysql:8.0
```

### 修复3: 内存问题

```bash
# 检查可用内存
free -h

# 清理内存
sudo sync && sudo sysctl -w vm.drop_caches=3

# 停止不必要的服务
sudo systemctl stop apache2 nginx 2>/dev/null || true
```

### 修复4: 使用不同的 MySQL 版本

```yaml
# 在 docker-compose.yml 中尝试不同版本
mysql:
  image: mysql:8.0.33  # 或 mysql:5.7
```

## 🚀 推荐的部署流程

### 步骤1: 清理环境

```bash
# 停止所有服务
docker compose down
docker compose -f docker-compose.arm.yml down

# 清理容器
docker container prune -f
```

### 步骤2: 选择配置

```bash
# 选项A: 修复脚本
./fix-mysql-restart.sh

# 选项B: 纯净配置
docker compose -f docker-compose.clean.yml up -d

# 选项C: 外部数据库
./setup-external-mysql.sh
docker compose -f docker-compose.external-db.yml up -d
```

### 步骤3: 验证部署

```bash
# 检查服务状态
docker compose ps

# 测试连接
curl http://localhost:45000/health
curl http://localhost:43000
```

## 📞 紧急联系方案

如果所有方案都失败：

1. **使用外部数据库**
   ```bash
   ./setup-external-mysql.sh
   ```

2. **使用 SQLite（开发测试）**
   - 修改后端配置使用 SQLite
   - 仅用于测试目的

3. **使用云数据库**
   - 配置云 MySQL 服务
   - 修改 .env 中的数据库连接

---

**立即执行的修复命令：**
```bash
# 停止当前失败的部署
docker compose down

# 使用修复脚本
./fix-mysql-restart.sh

# 或使用纯净配置
docker compose -f docker-compose.clean.yml up -d
```