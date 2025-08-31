#!/bin/bash

# 网络问题修复脚本

set -e

echo "🌐 网络问题修复"
echo "=============="

echo "🛑 停止所有服务..."
docker compose -f docker-compose.working.yml down

echo "🧹 清理网络资源..."
# 删除项目网络
docker network rm code-academy-recruitment_recruitment-network 2>/dev/null || true

# 清理未使用的网络
docker network prune -f

echo "🔍 检查网络状态..."
docker network ls

echo ""
echo "🚀 重新创建服务和网络..."

# 先创建网络
echo "1️⃣ 创建项目网络..."
docker network create code-academy-recruitment_recruitment-network 2>/dev/null || true

# 分别启动服务，确保网络连接
echo "2️⃣ 启动 MySQL..."
docker compose -f docker-compose.working.yml up -d mysql

echo "⏳ 等待 MySQL 启动..."
sleep 60

echo "3️⃣ 启动 Redis..."  
docker compose -f docker-compose.working.yml up -d redis

echo "⏳ 等待 Redis 启动..."
sleep 10

echo "4️⃣ 启动后端..."
docker compose -f docker-compose.working.yml up -d backend

echo "⏳ 等待后端启动..."
sleep 30

# 检查后端网络
echo "🔍 检查后端网络连接..."
if docker exec recruitment-backend ping -c 1 mysql >/dev/null 2>&1; then
    echo "✅ 后端 -> MySQL 网络连通"
else
    echo "❌ 后端 -> MySQL 网络不通"
    echo "后端容器网络信息:"
    docker inspect recruitment-backend --format '{{range .NetworkSettings.Networks}}网络: {{.NetworkID}}, IP: {{.IPAddress}}{{end}}'
fi

if docker exec recruitment-backend ping -c 1 redis >/dev/null 2>&1; then
    echo "✅ 后端 -> Redis 网络连通"
else
    echo "❌ 后端 -> Redis 网络不通"
fi

# 测试后端 API
echo "🧪 测试后端 API..."
if docker exec recruitment-backend curl -f http://localhost:5000/health >/dev/null 2>&1; then
    echo "✅ 后端内部 API 正常"
else
    echo "❌ 后端内部 API 异常"
    echo "后端日志:"
    docker logs recruitment-backend --tail=10
fi

echo "5️⃣ 重建并启动前端..."
# 重建前端镜像以应用新的 nginx 配置
docker compose -f docker-compose.working.yml build --no-cache frontend
docker compose -f docker-compose.working.yml up -d frontend

echo "⏳ 等待前端启动..."
sleep 20

# 检查前端网络
echo "🔍 检查前端网络连接..."
if docker exec recruitment-frontend ping -c 1 recruitment-backend >/dev/null 2>&1; then
    echo "✅ 前端 -> 后端 网络连通"
else
    echo "❌ 前端 -> 后端 网络不通"
    echo "前端容器网络信息:"
    docker inspect recruitment-frontend --format '{{range .NetworkSettings.Networks}}网络: {{.NetworkID}}, IP: {{.IPAddress}}{{end}}'
fi

# 最终测试
echo ""
echo "🏥 最终健康检查..."

echo "📊 容器状态:"
docker compose -f docker-compose.working.yml ps

echo ""
echo "🌐 网络连接测试:"
echo "主机 -> 后端:"
curl -f http://localhost:45000/health >/dev/null 2>&1 && echo "✅ 正常" || echo "❌ 异常"

echo "主机 -> 前端:"
curl -f http://localhost:43000/health >/dev/null 2>&1 && echo "✅ 正常" || echo "❌ 异常"

echo "前端代理 -> 后端:"
curl -f http://localhost:43000/api/health >/dev/null 2>&1 && echo "✅ 正常" || echo "❌ 异常"

echo ""
echo "🎯 网络修复完成！"
echo "================"
echo "🌐 访问地址:"
echo "前端: http://localhost:43000"
echo "后端: http://localhost:45000"
echo "前端通过代理访问后端: http://localhost:43000/api/health"