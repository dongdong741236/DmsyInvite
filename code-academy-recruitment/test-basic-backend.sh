#!/bin/bash

# 测试最基本的后端启动

echo "🧪 测试基本后端启动"
echo "=================="

echo "🛑 停止当前后端..."
docker compose stop backend
docker compose rm -f backend

echo "🔨 重新构建后端（基本版本）..."
docker compose build --no-cache backend

echo "🚀 启动基本后端..."
docker compose up -d backend

echo "⏳ 等待启动（15秒）..."
sleep 15

echo ""
echo "🔍 检查基本后端状态..."
docker compose ps backend

echo ""
echo "📋 基本后端日志:"
docker logs recruitment-backend

echo ""
echo "🧪 测试基本 API..."
if curl -f http://localhost:45000/health >/dev/null 2>&1; then
    echo "✅ 基本后端 API 正常"
    curl http://localhost:45000/health
else
    echo "❌ 基本后端 API 异常"
fi

echo ""
echo "🔧 测试结果分析:"
if docker ps --filter "name=recruitment-backend" --format "{{.Status}}" | grep -q "Up"; then
    echo "✅ 基本版本启动成功！"
    echo "问题在于完整版本的某些功能"
    echo ""
    echo "📞 下一步："
    echo "1. 恢复完整版本: cp backend/src/index.original.ts backend/src/index.ts"
    echo "2. 逐步添加功能，找到问题模块"
else
    echo "❌ 连基本版本都启动失败"
    echo "问题可能在于："
    echo "1. Docker 环境问题"
    echo "2. 基础依赖问题"
    echo "3. 容器运行时问题"
fi