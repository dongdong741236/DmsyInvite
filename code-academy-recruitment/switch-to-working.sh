#!/bin/bash

# 从调试配置切换到工作配置

echo "🔄 切换到工作配置"
echo "================"

echo "🛑 停止调试版服务..."
docker compose -f docker-compose.debug.yml down

echo "🔨 使用修复后的代码重建工作版镜像..."
docker compose -f docker-compose.working.yml build --no-cache backend

echo "🚀 启动完整的工作版服务..."
docker compose -f docker-compose.working.yml up -d

echo "⏳ 等待所有服务启动（60秒）..."
sleep 60

echo ""
echo "🔍 检查工作版状态..."
docker compose -f docker-compose.working.yml ps

echo ""
echo "🧪 测试所有服务..."

# 测试后端
echo "测试后端 API:"
if curl -f http://localhost:45000/health >/dev/null 2>&1; then
    echo "✅ 后端正常"
    curl http://localhost:45000/health
else
    echo "❌ 后端异常"
    echo "后端日志:"
    docker logs recruitment-backend --tail=10
fi

# 测试前端
echo ""
echo "测试前端:"
if curl -f http://localhost:43000/health >/dev/null 2>&1; then
    echo "✅ 前端正常"
else
    echo "❌ 前端异常"
    echo "前端日志:"
    docker logs recruitment-frontend --tail=10
fi

# 测试前端代理
echo ""
echo "测试前端 API 代理:"
if curl -f http://localhost:43000/api/health >/dev/null 2>&1; then
    echo "✅ 前端代理正常"
    curl http://localhost:43000/api/health
else
    echo "❌ 前端代理异常"
fi

echo ""
echo "🎉 切换完成！"
echo "============="
echo "🌐 访问地址:"
echo "前端: http://localhost:43000"
echo "后端: http://localhost:45000"
echo ""
echo "📋 管理命令:"
echo "查看状态: docker compose -f docker-compose.working.yml ps"
echo "查看日志: docker compose -f docker-compose.working.yml logs -f"