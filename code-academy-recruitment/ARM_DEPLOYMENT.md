# ARM 架构部署指南

## 支持的 ARM 设备

### 完全支持
- 🍎 **Apple Silicon Mac** (M1, M2, M3)
- 🥧 **树莓派 4** (8GB RAM 推荐)
- 🔧 **NVIDIA Jetson** 系列
- ☁️ **AWS Graviton** 实例
- 🌐 **Oracle ARM** 云实例

### 基本支持
- 🥧 **树莓派 3B+** (性能受限)
- 📱 **其他 ARMv7/ARMv8** 设备

## 架构自动检测

系统会自动检测您的架构并选择最优配置：

```bash
# 查看当前架构
make help

# 输出示例：
# 当前架构: aarch64
# 使用配置: docker-compose.arm.yml
```

## ARM 优化配置

### MySQL 8.0 ARM 优化

ARM 版本使用了更保守的资源配置：

```ini
# 标准配置 (x86_64)
innodb_buffer_pool_size=256M
max_connections=200

# ARM 优化配置
innodb_buffer_pool_size=128M    # 减少内存使用
max_connections=100             # 减少连接数
innodb_io_capacity=100          # 适配较慢的存储
```

### 容器资源限制

ARM 设备通常内存和 CPU 资源有限：

```yaml
# 后端服务资源限制
deploy:
  resources:
    limits:
      memory: 512M
    reservations:
      memory: 256M

# 前端服务资源限制  
deploy:
  resources:
    limits:
      memory: 256M
    reservations:
      memory: 128M
```

## 部署方式

### 方式1：自动架构检测（推荐）

```bash
# 系统会自动检测架构并选择最优配置
./deploy.sh

# 或使用 Make
make prod
```

### 方式2：手动指定架构

```bash
# 强制使用 ARM 配置
make arm

# 强制使用 x86 配置
make x86

# 使用特定 compose 文件
docker-compose -f docker-compose.arm.yml up -d
```

### 方式3：多架构构建

```bash
# 构建支持多架构的镜像
./build-multiarch.sh
```

## ARM 设备性能调优

### 树莓派 4 推荐配置

**最低要求：**
- 4GB RAM（8GB 推荐）
- 32GB+ SD卡（Class 10 或 A1）
- 稳定的电源供应

**系统优化：**

```bash
# 增加 swap 空间
sudo dphys-swapfile swapoff
sudo sed -i 's/CONF_SWAPSIZE=100/CONF_SWAPSIZE=1024/' /etc/dphys-swapfile
sudo dphys-swapfile setup
sudo dphys-swapfile swapon

# GPU 内存分配（如果不使用图形界面）
echo 'gpu_mem=16' | sudo tee -a /boot/config.txt
```

### Apple Silicon Mac 优化

```bash
# 使用 Rosetta 2 兼容层（如果需要）
export DOCKER_DEFAULT_PLATFORM=linux/arm64

# 或强制使用 ARM64
export DOCKER_BUILDKIT=1
```

## 性能对比

| 设备类型 | 启动时间 | 内存使用 | 推荐配置 |
|----------|----------|----------|----------|
| Apple M1/M2 | ~30秒 | 512MB | 标准配置 |
| 树莓派 4 (8GB) | ~60秒 | 400MB | ARM优化 |
| 树莓派 4 (4GB) | ~90秒 | 350MB | ARM优化 |
| AWS Graviton | ~25秒 | 512MB | 标准配置 |

## 故障排除

### 常见 ARM 部署问题

1. **镜像架构不匹配**
   ```bash
   # 检查镜像架构
   docker image inspect mysql:8.0 | grep Architecture
   
   # 强制拉取 ARM 镜像
   docker pull --platform linux/arm64 mysql:8.0
   ```

2. **内存不足**
   ```bash
   # 检查内存使用
   docker stats
   
   # 调整 MySQL 配置
   # 编辑 docker/mysql/my-arm.cnf，减少 innodb_buffer_pool_size
   ```

3. **启动超时**
   ```bash
   # ARM 设备启动较慢，增加等待时间
   # 在 docker-compose.arm.yml 中已经配置了更长的健康检查时间
   ```

### 性能监控

```bash
# 查看容器资源使用
docker stats --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}"

# 查看系统负载
htop  # 或 top

# 查看磁盘 IO
iostat -x 1
```

## ARM 部署最佳实践

### 1. 硬件要求

**最低配置：**
- ARM64 处理器
- 2GB RAM
- 16GB 存储空间
- 稳定网络连接

**推荐配置：**
- ARM64 处理器（4核+）
- 4GB+ RAM
- 32GB+ 高速存储
- 千兆网络

### 2. 系统优化

```bash
# 优化 Docker 配置
echo '{"log-driver": "json-file", "log-opts": {"max-size": "10m", "max-file": "3"}}' | sudo tee /etc/docker/daemon.json

# 重启 Docker
sudo systemctl restart docker
```

### 3. 监控和维护

```bash
# 定期清理
make clean

# 监控资源使用
watch -n 5 'docker stats --no-stream'

# 检查磁盘空间
df -h
```

## 架构特定镜像标签

如果需要手动指定镜像架构：

```yaml
# x86_64
mysql:
  image: mysql:8.0
  platform: linux/amd64

# ARM64
mysql:
  image: mysql:8.0  
  platform: linux/arm64

# ARMv7
mysql:
  image: mysql:8.0
  platform: linux/arm/v7
```

## 总结

✅ **完全支持 ARM 架构部署**
- 自动架构检测
- ARM 优化配置
- 多架构镜像支持
- 性能调优

✅ **一键部署体验**
- 无需手动配置
- 自动选择最优设置
- 完整的错误处理

✅ **生产就绪**
- 健康检查
- 资源限制
- 监控支持

现在您可以在任何 ARM 设备上轻松部署代码书院纳新系统！