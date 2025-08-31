#!/bin/bash

# 测试最小化后端配置

echo "🧪 测试最小化后端"
echo "================"

echo "🛑 停止当前后端..."
docker compose stop backend
docker compose rm -f backend

echo "🔨 构建最小化后端镜像..."
docker build -f backend/Dockerfile.minimal -t backend-minimal ./backend

echo "🚀 启动最小化后端..."
docker run -d --name backend-minimal \
    --network code-academy-recruitment_recruitment-network \
    -p 45001:5000 \
    -e NODE_ENV=development \
    -e DB_HOST=mysql \
    -e REDIS_HOST=redis \
    -e DB_USER=recruitment_user \
    -e DB_PASSWORD=${DB_PASSWORD:-your_secure_password} \
    -e REDIS_PASSWORD=${REDIS_PASSWORD:-your_redis_password} \
    -e JWT_SECRET=test_secret_key_for_minimal_test \
    backend-minimal

echo "⏳ 等待启动（15秒）..."
sleep 15

echo ""
echo "🔍 检查最小化后端状态..."
docker ps --filter "name=backend-minimal" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo ""
echo "📋 最小化后端日志:"
docker logs backend-minimal

echo ""
echo "🧪 测试 API 访问..."
echo "测试端口 45001:"
if curl -f http://localhost:45001/health >/dev/null 2>&1; then
    echo "✅ 最小化后端 API 正常"
    curl http://localhost:45001/health
else
    echo "❌ 最小化后端 API 异常"
fi

echo ""
echo "🔧 清理测试容器..."
docker stop backend-minimal
docker rm backend-minimal
docker image rm backend-minimal

echo ""
echo "📊 测试结果分析:"
if docker logs backend-minimal 2>&1 | grep -q "Minimal server running"; then
    echo "✅ 最小化版本启动成功"
    echo "问题可能在于："
    echo "1. 数据库连接配置"
    echo "2. 新增的功能模块"
    echo "3. 权限或文件系统问题"
    echo ""
    echo "建议: 使用最小化版本部署"
else
    echo "❌ 连最小化版本都启动失败"
    echo "问题可能在于："
    echo "1. 基础环境问题"
    echo "2. Docker 镜像构建问题"
    echo "3. 容器运行时环境问题"
fi

echo ""
echo "📞 下一步建议:"
echo "./deploy.sh clean  # 使用修复后的配置重新部署"