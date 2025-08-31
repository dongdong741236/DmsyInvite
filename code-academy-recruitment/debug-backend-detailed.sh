#!/bin/bash

# 详细的后端调试脚本

echo "🔍 后端详细调试"
echo "=============="

echo "🛑 停止当前后端..."
docker compose -f docker-compose.working.yml stop backend
docker compose -f docker-compose.working.yml rm -f backend

echo "🔨 使用调试配置构建后端..."
docker compose -f docker-compose.debug.yml build backend

echo "🚀 启动调试版后端..."
docker compose -f docker-compose.debug.yml up -d mysql redis

echo "⏳ 等待数据库启动..."
sleep 30

echo "🔍 测试数据库连接..."
if docker compose -f docker-compose.debug.yml exec mysql mysqladmin ping >/dev/null 2>&1; then
    echo "✅ MySQL 可用"
else
    echo "❌ MySQL 不可用"
    exit 1
fi

if docker compose -f docker-compose.debug.yml exec redis redis-cli ping >/dev/null 2>&1; then
    echo "✅ Redis 可用"
else
    echo "❌ Redis 不可用"
    exit 1
fi

echo ""
echo "🚀 启动调试版后端（不自动重启）..."
docker compose -f docker-compose.debug.yml up -d backend

echo "⏳ 等待后端启动..."
sleep 10

echo ""
echo "📋 后端启动日志:"
echo "=================="
docker logs recruitment-backend-debug

echo ""
echo "🔍 后端容器状态:"
docker ps --filter "name=recruitment-backend-debug" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo ""
echo "🧪 手动测试后端启动..."

if docker ps --filter "name=recruitment-backend-debug" --format "{{.Status}}" | grep -q "Up"; then
    echo "✅ 容器运行中"
    
    echo "测试容器内部命令:"
    docker exec recruitment-backend-debug pwd 2>/dev/null && echo "✅ 容器可执行命令" || echo "❌ 容器无法执行命令"
    
    echo "检查应用文件:"
    docker exec recruitment-backend-debug ls -la /app/dist/ 2>/dev/null && echo "✅ 编译文件存在" || echo "❌ 编译文件缺失"
    
    echo "检查 Node.js:"
    docker exec recruitment-backend-debug node --version 2>/dev/null && echo "✅ Node.js 正常" || echo "❌ Node.js 异常"
    
    echo "手动启动应用（5秒测试）:"
    timeout 5 docker exec recruitment-backend-debug node dist/index.js 2>&1 || echo "手动启动测试完成"
    
    echo ""
    echo "检查网络连接:"
    docker exec recruitment-backend-debug ping -c 1 mysql 2>/dev/null && echo "✅ 可以连接 MySQL" || echo "❌ 无法连接 MySQL"
    docker exec recruitment-backend-debug ping -c 1 redis 2>/dev/null && echo "✅ 可以连接 Redis" || echo "❌ 无法连接 Redis"
    
else
    echo "❌ 容器未运行"
    echo "容器状态:"
    docker ps -a --filter "name=recruitment-backend-debug"
    
    echo ""
    echo "容器详细状态:"
    docker inspect recruitment-backend-debug --format '{{.State.Status}} - 退出码: {{.State.ExitCode}} - 错误: {{.State.Error}}'
fi

echo ""
echo "🔧 建议的修复方案:"
echo "=================="

if docker logs recruitment-backend-debug 2>&1 | grep -q "Error"; then
    echo "1. ❌ 发现应用错误，检查代码"
    echo "错误信息:"
    docker logs recruitment-backend-debug 2>&1 | grep "Error" | tail -3
elif docker logs recruitment-backend-debug 2>&1 | wc -l | awk '{print $1}' | grep -q "^0$"; then
    echo "1. ❌ 无日志输出，容器立即退出"
    echo "可能原因:"
    echo "   - 启动命令错误"
    echo "   - 文件权限问题"
    echo "   - 依赖缺失"
    echo ""
    echo "建议测试:"
    echo "   docker run --rm -it code-academy-recruitment-backend sh"
else
    echo "1. ℹ️  有日志输出，分析具体错误"
fi

echo ""
echo "📞 进一步调试:"
echo "进入容器: docker exec -it recruitment-backend-debug sh"
echo "查看日志: docker logs -f recruitment-backend-debug"
echo "手动启动: docker exec recruitment-backend-debug node dist/index.js"