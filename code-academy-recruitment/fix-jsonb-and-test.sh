#!/bin/bash

# 修复 JSONB 问题并测试后端启动

set -e

echo "🔧 修复 JSONB 类型问题"
echo "===================="

echo "✅ 已修复 Interview 模型中的 jsonb → json"

echo "🔨 重新构建后端..."
docker compose -f docker-compose.debug.yml build --no-cache backend

echo "🚀 启动修复后的后端..."
docker compose -f docker-compose.debug.yml up -d backend

echo "⏳ 等待后端启动（20秒）..."
sleep 20

echo ""
echo "🔍 检查修复结果..."

# 检查容器状态
CONTAINER_STATUS=$(docker ps --filter "name=recruitment-backend-debug" --format "{{.Status}}")
echo "容器状态: $CONTAINER_STATUS"

if echo "$CONTAINER_STATUS" | grep -q "Up"; then
    echo "✅ 容器运行正常！"
    
    echo ""
    echo "📋 后端启动日志:"
    docker logs recruitment-backend-debug
    
    echo ""
    echo "🧪 API 测试:"
    
    # 等待应用完全启动
    echo "等待应用完全启动（10秒）..."
    sleep 10
    
    # 测试内部 API
    if docker exec recruitment-backend-debug curl -f http://localhost:5000/health 2>/dev/null; then
        echo "✅ 后端内部 API 正常"
        echo "API 响应:"
        docker exec recruitment-backend-debug curl http://localhost:5000/health 2>/dev/null
    else
        echo "❌ 后端内部 API 异常"
        echo "检查端口监听:"
        docker exec recruitment-backend-debug netstat -tln 2>/dev/null | grep :5000 || echo "端口 5000 未监听"
    fi
    
    # 测试外部访问
    echo ""
    echo "测试外部访问:"
    if curl -f http://localhost:45000/health >/dev/null 2>&1; then
        echo "✅ 外部 API 访问正常"
        echo "API 响应:"
        curl http://localhost:45000/health
    else
        echo "❌ 外部 API 访问失败"
    fi
    
else
    echo "❌ 容器启动失败"
    echo ""
    echo "📋 错误日志:"
    docker logs recruitment-backend-debug
    
    echo ""
    echo "容器详细状态:"
    docker ps -a --filter "name=recruitment-backend-debug"
fi

echo ""
echo "🎯 如果修复成功，切换到工作配置:"
echo "========================================="

if echo "$CONTAINER_STATUS" | grep -q "Up" && curl -f http://localhost:45000/health >/dev/null 2>&1; then
    echo "✅ 后端修复成功！"
    echo ""
    echo "🚀 现在启动完整系统:"
    echo "1. 停止调试版: docker compose -f docker-compose.debug.yml down"
    echo "2. 启动工作版: docker compose -f docker-compose.working.yml up -d"
    echo "3. 等待启动: sleep 30"
    echo "4. 测试访问: curl http://localhost:45000/health"
    echo ""
    echo "或者运行自动脚本:"
    echo "./switch-to-working.sh"
else
    echo "❌ 后端仍有问题"
    echo "建议查看完整日志: docker logs recruitment-backend-debug"
fi