#!/bin/bash

# 重启后端服务并检查启动状态

echo "🔄 重启后端服务"
echo "=============="

echo "🛑 停止后端容器..."
docker compose -f docker-compose.working.yml stop backend

echo "🗑️  删除后端容器..."
docker compose -f docker-compose.working.yml rm -f backend

echo "🔨 重新构建后端镜像..."
docker compose -f docker-compose.working.yml build --no-cache backend

echo "🚀 启动后端容器..."
docker compose -f docker-compose.working.yml up -d backend

echo "⏳ 等待后端启动..."
sleep 10

echo "🔍 检查后端启动过程..."
echo "===================="

# 实时查看后端日志
echo "📋 后端启动日志:"
docker logs recruitment-backend

echo ""
echo "🔍 后端进程状态:"
if docker exec recruitment-backend ps aux 2>/dev/null; then
    echo "✅ 后端容器响应正常"
else
    echo "❌ 后端容器无响应"
fi

echo ""
echo "🌐 网络连接测试:"

# 测试数据库连接
echo "测试 MySQL 连接:"
if docker exec recruitment-backend ping -c 1 mysql >/dev/null 2>&1; then
    echo "✅ MySQL 网络连通"
    
    # 测试 MySQL 端口
    if docker exec recruitment-backend nc -z mysql 3306 2>/dev/null; then
        echo "✅ MySQL 端口可达"
    else
        echo "❌ MySQL 端口不可达"
    fi
else
    echo "❌ MySQL 网络不通"
fi

# 测试 Redis 连接
echo "测试 Redis 连接:"
if docker exec recruitment-backend ping -c 1 redis >/dev/null 2>&1; then
    echo "✅ Redis 网络连通"
    
    # 测试 Redis 端口
    if docker exec recruitment-backend nc -z redis 6379 2>/dev/null; then
        echo "✅ Redis 端口可达"
    else
        echo "❌ Redis 端口不可达"
    fi
else
    echo "❌ Redis 网络不通"
fi

echo ""
echo "🧪 API 测试:"

# 等待更长时间让后端完全启动
echo "等待后端完全启动（30秒）..."
sleep 30

echo "测试后端内部 API:"
if docker exec recruitment-backend curl -f http://localhost:5000/health 2>/dev/null; then
    echo "✅ 后端内部 API 正常"
    echo "API 响应:"
    docker exec recruitment-backend curl http://localhost:5000/health 2>/dev/null
else
    echo "❌ 后端内部 API 异常"
    echo "检查端口监听:"
    docker exec recruitment-backend netstat -tln 2>/dev/null | grep :5000 || echo "端口 5000 未监听"
fi

echo ""
echo "测试外部 API 访问:"
if curl -f http://localhost:45000/health >/dev/null 2>&1; then
    echo "✅ 外部 API 访问正常"
    echo "API 响应:"
    curl http://localhost:45000/health
else
    echo "❌ 外部 API 访问失败"
fi

echo ""
echo "🎯 后端状态总结:"
echo "================"

# 检查容器状态
CONTAINER_STATUS=$(docker inspect recruitment-backend --format '{{.State.Status}}')
echo "容器状态: $CONTAINER_STATUS"

if [ "$CONTAINER_STATUS" = "running" ]; then
    echo "✅ 容器运行中"
    
    # 检查应用是否启动
    if docker logs recruitment-backend 2>&1 | grep -q "Server running on port"; then
        echo "✅ 应用已启动"
    else
        echo "❌ 应用未启动，可能仍在初始化"
        echo "建议: 等待更长时间或检查错误日志"
    fi
else
    echo "❌ 容器未运行: $CONTAINER_STATUS"
fi

echo ""
echo "📞 如果后端仍有问题:"
echo "1. 查看完整日志: docker logs recruitment-backend"
echo "2. 进入容器调试: docker exec -it recruitment-backend sh"
echo "3. 检查环境变量: docker exec recruitment-backend env"
echo "4. 手动启动应用: docker exec recruitment-backend node dist/index.js"