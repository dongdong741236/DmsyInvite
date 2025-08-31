#!/bin/bash

# 修复部署问题的脚本

set -e

echo "🔧 代码书院 - 部署问题修复"
echo "=========================="

# 检测架构
ARCH=$(uname -m)
echo "检测到架构: $ARCH"

# 停止所有容器
echo "🛑 停止所有现有容器..."
docker compose down 2>/dev/null || true
docker compose -f docker-compose.arm.yml down 2>/dev/null || true
docker compose -f docker-compose.simple.yml down 2>/dev/null || true

# 清理可能有问题的容器和网络
echo "🧹 清理资源..."
docker container rm recruitment-mysql recruitment-redis recruitment-backend recruitment-frontend 2>/dev/null || true
docker network rm code-academy-recruitment_recruitment-network 2>/dev/null || true

# 检查 MySQL 容器日志（如果存在）
echo "🔍 检查 MySQL 错误日志..."
if docker ps -a --format "{{.Names}}" | grep -q recruitment-mysql; then
    echo "MySQL 容器日志："
    docker logs recruitment-mysql 2>/dev/null || echo "无法获取 MySQL 日志"
fi

# 选择合适的配置文件
COMPOSE_FILE="docker-compose.simple.yml"

echo "📝 使用简化配置文件: $COMPOSE_FILE"
echo "   - 移除了内存限制"
echo "   - 简化了健康检查"
echo "   - 使用基础 MySQL 配置"

# 检查配置文件
if [ ! -f .env ]; then
    echo "📝 创建配置文件..."
    cp .env.example .env
    echo "⚠️  请编辑 .env 文件配置数据库密码等参数"
    echo ""
    read -p "配置完成后按回车继续..."
fi

# 分步启动服务
echo "🚀 分步启动服务..."

echo "1️⃣ 启动 MySQL..."
docker compose -f $COMPOSE_FILE up -d mysql

echo "⏳ 等待 MySQL 启动（60秒）..."
sleep 60

echo "🔍 检查 MySQL 状态..."
if docker compose -f $COMPOSE_FILE ps mysql | grep -q "Up"; then
    echo "✅ MySQL 启动成功"
else
    echo "❌ MySQL 启动失败，查看日志："
    docker compose -f $COMPOSE_FILE logs mysql
    echo ""
    echo "🔧 尝试修复建议："
    echo "1. 检查 .env 文件中的数据库密码配置"
    echo "2. 确保端口 43306 未被占用"
    echo "3. 检查磁盘空间是否充足"
    exit 1
fi

echo "2️⃣ 启动 Redis..."
docker compose -f $COMPOSE_FILE up -d redis

echo "⏳ 等待 Redis 启动（10秒）..."
sleep 10

echo "3️⃣ 启动后端..."
docker compose -f $COMPOSE_FILE up -d backend

echo "⏳ 等待后端启动（30秒）..."
sleep 30

echo "4️⃣ 启动前端..."
docker compose -f $COMPOSE_FILE up -d frontend

echo "⏳ 等待前端启动（15秒）..."
sleep 15

# 最终状态检查
echo "🔍 最终状态检查..."
docker compose -f $COMPOSE_FILE ps

echo ""
echo "🏥 健康检查..."

# 检查 MySQL
if docker compose -f $COMPOSE_FILE exec mysql mysqladmin ping -h localhost 2>/dev/null; then
    echo "✅ MySQL 健康"
else
    echo "❌ MySQL 不健康"
fi

# 检查后端
if curl -f http://localhost:45000/health > /dev/null 2>&1; then
    echo "✅ 后端 API 健康"
else
    echo "❌ 后端 API 不健康"
fi

# 检查前端
if curl -f http://localhost:43000 > /dev/null 2>&1; then
    echo "✅ 前端服务健康"
else
    echo "❌ 前端服务不健康"
fi

echo ""
echo "🎉 修复部署完成！"
echo "==================="
echo "🌐 访问地址："
echo "前端: http://localhost:43000"
echo "后端: http://localhost:45000"
echo ""
echo "📋 管理命令："
echo "查看状态: docker compose -f $COMPOSE_FILE ps"
echo "查看日志: docker compose -f $COMPOSE_FILE logs -f"
echo "重启服务: docker compose -f $COMPOSE_FILE restart"
echo "停止服务: docker compose -f $COMPOSE_FILE down"