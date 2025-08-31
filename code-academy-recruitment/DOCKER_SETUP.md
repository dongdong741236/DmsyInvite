# Docker 和 Docker Compose 安装指南

## 🐳 Docker Compose V2 说明

本项目使用 **Docker Compose V2**（`docker compose` 命令），这是 Docker 的新版本组合工具。

### 版本对比

| 特性 | V1 (docker-compose) | V2 (docker compose) |
|------|---------------------|---------------------|
| 命令格式 | `docker-compose` | `docker compose` |
| 安装方式 | 独立安装 | Docker 插件 |
| 性能 | Python 实现 | Go 实现，更快 |
| 维护状态 | 已弃用 | 官方推荐 |

## 📦 安装 Docker 和 Docker Compose V2

### Ubuntu/Debian 安装

```bash
# 1. 更新包列表
sudo apt update

# 2. 安装依赖
sudo apt install -y apt-transport-https ca-certificates curl gnupg lsb-release

# 3. 添加 Docker 官方 GPG 密钥
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# 4. 添加 Docker 仓库
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# 5. 安装 Docker 和 Compose V2
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# 6. 启动 Docker
sudo systemctl start docker
sudo systemctl enable docker

# 7. 添加用户到 docker 组
sudo usermod -aG docker $USER

# 8. 重新登录或执行
newgrp docker
```

### CentOS/RHEL 安装

```bash
# 1. 安装 yum-utils
sudo yum install -y yum-utils

# 2. 添加 Docker 仓库
sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo

# 3. 安装 Docker 和 Compose V2
sudo yum install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# 4. 启动 Docker
sudo systemctl start docker
sudo systemctl enable docker

# 5. 添加用户到 docker 组
sudo usermod -aG docker $USER
```

### 验证安装

```bash
# 检查 Docker 版本
docker --version

# 检查 Docker Compose V2 版本
docker compose version

# 测试运行
docker run hello-world
```

**预期输出：**
```
Docker version 24.0.0, build 1234567
Docker Compose version v2.20.0
```

## 🔧 从 V1 迁移到 V2

如果您之前使用的是 `docker-compose` V1：

### 1. 卸载旧版本

```bash
# 卸载独立安装的 docker-compose
sudo rm /usr/local/bin/docker-compose

# 或通过 pip 卸载
pip uninstall docker-compose
```

### 2. 安装新版本

按照上面的安装步骤安装 `docker-compose-plugin`。

### 3. 命令对照

```bash
# 旧命令 → 新命令
docker-compose up -d        → docker compose up -d
docker-compose down         → docker compose down
docker-compose logs -f      → docker compose logs -f
docker-compose ps           → docker compose ps
docker-compose build        → docker compose build
docker-compose restart      → docker compose restart
```

## 🚀 项目部署命令

### 自动部署（推荐）

```bash
# 完整自动部署
./server-setup.sh

# 快速部署（已有 Docker 环境）
./quick-deploy.sh

# 使用 Make 命令
make prod
```

### 手动部署

```bash
# 1. 配置环境
cp .env.example .env
nano .env

# 2. 启动服务
docker compose up -d

# 3. 查看状态
docker compose ps

# 4. 查看日志
docker compose logs -f
```

### 架构特定部署

```bash
# 自动检测架构
make up

# 强制使用 ARM 配置
make arm
# 或
docker compose -f docker-compose.arm.yml up -d

# 强制使用 x86 配置
make x86
# 或
docker compose -f docker-compose.yml up -d
```

## 🔍 验证 Docker Compose V2

运行以下命令验证安装：

```bash
# 检查版本
docker compose version

# 检查插件
docker info | grep -i compose

# 测试功能
docker compose config --help
```

如果出现 `command not found` 错误，说明需要安装 `docker-compose-plugin`。

## 🆘 常见问题

### 问题1: 命令不存在

```bash
# 错误信息
bash: docker: command not found
# 解决方案
sudo apt install docker.io docker-compose-plugin
```

### 问题2: 权限被拒绝

```bash
# 错误信息
permission denied while trying to connect to the Docker daemon
# 解决方案
sudo usermod -aG docker $USER
newgrp docker
```

### 问题3: 服务启动失败

```bash
# 检查日志
docker compose logs

# 检查配置
docker compose config

# 重新构建
docker compose build --no-cache
```

## 📋 部署检查清单

- [ ] Docker 已安装并运行
- [ ] Docker Compose V2 已安装
- [ ] 用户已添加到 docker 组
- [ ] 端口 43000, 45000 可用
- [ ] .env 文件已配置
- [ ] 防火墙已开放相应端口

---

**快速验证命令：**
```bash
docker --version && docker compose version && echo "✅ 环境就绪"
```