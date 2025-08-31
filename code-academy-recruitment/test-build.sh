#!/bin/bash

# 测试构建脚本 - 验证代码编译无误

set -e

echo "🔨 代码书院 - 测试构建"
echo "======================"

# 检测架构
ARCH=$(uname -m)
COMPOSE_FILE="docker-compose.yml"

if [[ "$ARCH" == "aarch64" ]] || [[ "$ARCH" == "arm64" ]] || [[ "$ARCH" == "armv7l" ]]; then
    echo "🔧 使用 ARM 配置"
    COMPOSE_FILE="docker-compose.arm.yml"
fi

echo "📦 清理旧容器..."
docker compose -f $COMPOSE_FILE down 2>/dev/null || true

echo "🔨 测试后端构建..."
docker compose -f $COMPOSE_FILE build backend

echo "🔨 测试前端构建..."
docker compose -f $COMPOSE_FILE build frontend

echo "✅ 构建测试完成！"
echo ""
echo "🚀 如果构建成功，可以启动服务："
echo "docker compose -f $COMPOSE_FILE up -d"
echo ""
echo "或使用快速部署："
echo "./quick-deploy.sh"