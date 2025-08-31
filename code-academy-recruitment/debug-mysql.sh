#!/bin/bash

# MySQL 故障排除脚本

echo "🔍 MySQL 故障诊断"
echo "================"

# 检查端口占用
echo "1️⃣ 检查端口 43306 占用情况..."
if netstat -tlnp 2>/dev/null | grep -q :43306; then
    echo "❌ 端口 43306 已被占用："
    netstat -tlnp | grep :43306
    echo ""
    echo "解决方案：停止占用进程或修改端口配置"
else
    echo "✅ 端口 43306 可用"
fi

# 检查磁盘空间
echo ""
echo "2️⃣ 检查磁盘空间..."
DISK_USAGE=$(df -h . | awk 'NR==2 {print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -gt 90 ]; then
    echo "❌ 磁盘空间不足：${DISK_USAGE}% 已使用"
    echo "解决方案：清理磁盘空间"
else
    echo "✅ 磁盘空间充足：${DISK_USAGE}% 已使用"
fi

# 检查内存
echo ""
echo "3️⃣ 检查内存使用..."
MEMORY_USAGE=$(free | awk 'NR==2{printf "%.0f", $3*100/$2}')
if [ "$MEMORY_USAGE" -gt 90 ]; then
    echo "❌ 内存使用过高：${MEMORY_USAGE}%"
    echo "解决方案：释放内存或增加 swap"
else
    echo "✅ 内存使用正常：${MEMORY_USAGE}%"
fi

# 检查 Docker 卷
echo ""
echo "4️⃣ 检查 Docker 卷..."
if docker volume ls | grep -q mysql_data; then
    echo "✅ MySQL 数据卷存在"
    VOLUME_SIZE=$(docker system df -v | grep mysql_data | awk '{print $3}' || echo "未知")
    echo "   卷大小: $VOLUME_SIZE"
else
    echo "⚠️  MySQL 数据卷不存在，将自动创建"
fi

# 检查 MySQL 容器状态
echo ""
echo "5️⃣ 检查 MySQL 容器..."
if docker ps -a --format "{{.Names}}" | grep -q recruitment-mysql; then
    echo "📊 MySQL 容器状态："
    docker ps -a --filter "name=recruitment-mysql" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
    
    echo ""
    echo "📋 MySQL 容器日志（最后20行）："
    docker logs --tail=20 recruitment-mysql 2>/dev/null || echo "无法获取日志"
else
    echo "ℹ️  MySQL 容器不存在"
fi

# 测试 MySQL 镜像
echo ""
echo "6️⃣ 测试 MySQL 镜像..."
if docker run --rm mysql:8.0 --version > /dev/null 2>&1; then
    echo "✅ MySQL 镜像可用"
else
    echo "❌ MySQL 镜像有问题"
fi

# 提供解决方案
echo ""
echo "🔧 解决方案建议："
echo "1. 如果端口被占用："
echo "   sudo netstat -tlnp | grep :43306"
echo "   sudo kill -9 <PID>"
echo ""
echo "2. 如果磁盘空间不足："
echo "   docker system prune -a"
echo "   sudo apt clean"
echo ""
echo "3. 如果内存不足："
echo "   docker stop \$(docker ps -q)"
echo "   sudo swapon --show  # 检查 swap"
echo ""
echo "4. 重置 MySQL 数据："
echo "   docker volume rm code-academy-recruitment_mysql_data"
echo ""
echo "5. 使用简化配置："
echo "   docker compose -f docker-compose.simple.yml up -d"

echo ""
echo "📞 如需帮助，请运行："
echo "./fix-deploy.sh  # 使用修复部署脚本"