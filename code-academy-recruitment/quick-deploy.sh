#!/bin/bash

# 代码书院 - 一键快速部署脚本
# 适用于已配置好的服务器环境

set -e

echo "🚀 代码书院实验室纳新系统 - 快速部署"
echo "========================================="

# 检查 Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker 未安装，请先运行: ./server-setup.sh"
    exit 1
fi

# 检查配置文件
if [ ! -f .env ]; then
    echo "📝 创建配置文件..."
    cp .env.example .env
    echo "⚠️  请编辑 .env 文件配置必要参数"
    echo "   nano .env"
    echo ""
    echo "必须配置的参数："
    echo "- DB_PASSWORD (数据库密码)"
    echo "- REDIS_PASSWORD (Redis密码)"
    echo "- JWT_SECRET (JWT密钥)"
    echo "- EMAIL_* (邮箱配置)"
    echo "- ALLOWED_EMAIL_DOMAIN (邮箱域名)"
    echo ""
    read -p "配置完成后按回车继续..."
fi

# 检测架构
ARCH=$(uname -m)
COMPOSE_FILE="docker-compose.yml"

if [[ "$ARCH" == "aarch64" ]] || [[ "$ARCH" == "arm64" ]] || [[ "$ARCH" == "armv7l" ]]; then
    echo "🔧 检测到 ARM 架构，使用优化配置"
    COMPOSE_FILE="docker-compose.arm.yml"
fi

echo "📦 停止旧服务..."
docker compose -f $COMPOSE_FILE down 2>/dev/null || true

echo "🔨 构建镜像..."
docker compose -f $COMPOSE_FILE build

echo "🚀 启动服务..."
docker compose -f $COMPOSE_FILE up -d

echo "⏳ 等待服务启动..."
sleep 20

echo "🔍 检查服务状态..."
docker compose -f $COMPOSE_FILE ps

echo ""
echo "✅ 部署完成！"
echo "========================================="
echo "🌐 访问地址："
echo "前端界面: http://$(hostname -I | awk '{print $1}'):43000"
echo "后端 API: http://$(hostname -I | awk '{print $1}'):45000"
echo ""
echo "📊 服务状态："
docker compose -f $COMPOSE_FILE ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}"
echo ""
echo "📋 管理命令："
echo "查看日志: docker compose -f $COMPOSE_FILE logs -f"
echo "重启服务: docker compose -f $COMPOSE_FILE restart"
echo "停止服务: docker compose -f $COMPOSE_FILE down"
echo "========================================="