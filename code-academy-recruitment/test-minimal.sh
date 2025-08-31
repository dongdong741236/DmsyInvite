#!/bin/bash

# 测试最简化版本

echo "🔍 测试最简化后端"
echo "================"

echo "🛑 完全停止服务..."
docker compose down

echo "🗑️  删除后端镜像..."
docker image rm code-academy-recruitment-backend 2>/dev/null || true

echo "🔨 重新构建最简化后端..."
docker compose build --no-cache backend

echo "🚀 只启动后端（不依赖数据库）..."
docker run -d --name test-backend \
  -p 45001:5000 \
  -e NODE_ENV=development \
  code-academy-recruitment-backend

echo "⏳ 等待启动（10秒）..."
sleep 10

echo ""
echo "🔍 检查容器状态..."
docker ps --filter "name=test-backend" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo ""
echo "📋 容器日志:"
docker logs test-backend

echo ""
echo "🧪 测试 API..."
if curl -f http://localhost:45001/health >/dev/null 2>&1; then
    echo "✅ 最简化后端正常工作！"
    echo "API 响应:"
    curl http://localhost:45001/health
    echo ""
    echo "🎯 问题可能在于数据库连接或依赖服务"
else
    echo "❌ 最简化后端也失败"
    echo "问题在于基础环境或代码"
fi

echo ""
echo "🧹 清理测试容器..."
docker stop test-backend 2>/dev/null || true
docker rm test-backend 2>/dev/null || true

echo ""
echo "📊 测试完成"