#!/bin/bash

# 强制重建所有镜像并部署

set -e

echo "🔨 强制重建和部署"
echo "================"

# 停止所有服务
echo "🛑 停止所有服务..."
docker compose down 2>/dev/null || true
docker compose -f docker-compose.arm.yml down 2>/dev/null || true
docker compose -f docker-compose.working.yml down 2>/dev/null || true

# 删除所有相关容器
echo "🗑️  删除旧容器..."
docker container rm recruitment-mysql recruitment-redis recruitment-backend recruitment-frontend 2>/dev/null || true

# 删除所有相关镜像（强制重建）
echo "🗑️  删除旧镜像..."
docker image rm code-academy-recruitment-backend code-academy-recruitment-frontend 2>/dev/null || true
docker image rm recruitment-backend recruitment-frontend 2>/dev/null || true

# 清理构建缓存
echo "🧹 清理构建缓存..."
docker builder prune -f

echo "✅ 清理完成"

# 检查配置文件
echo "🔍 检查配置文件..."
echo "后端 database.ts:"
grep -A 10 "extra:" backend/src/config/database.ts

echo ""
echo "前端 Dockerfile:"
grep "nginx-simple.conf" frontend/Dockerfile

echo ""
echo "Nginx 配置文件存在:"
ls -la frontend/nginx-simple.conf

# 强制重新构建
echo ""
echo "🔨 强制重新构建镜像..."

echo "1️⃣ 构建后端镜像..."
docker compose -f docker-compose.working.yml build --no-cache backend

echo "2️⃣ 构建前端镜像..."
docker compose -f docker-compose.working.yml build --no-cache frontend

echo "✅ 镜像重建完成"

# 启动服务
echo ""
echo "🚀 启动服务..."

echo "1️⃣ 启动数据库..."
docker compose -f docker-compose.working.yml up -d mysql redis

echo "⏳ 等待数据库启动（90秒）..."
sleep 90

echo "2️⃣ 启动后端..."
docker compose -f docker-compose.working.yml up -d backend

echo "⏳ 等待后端启动（30秒）..."
sleep 30

echo "3️⃣ 启动前端..."
docker compose -f docker-compose.working.yml up -d frontend

echo "⏳ 等待前端启动（15秒）..."
sleep 15

# 检查状态
echo ""
echo "🔍 检查服务状态..."
docker compose -f docker-compose.working.yml ps

echo ""
echo "🏥 健康检查..."

# 检查后端
echo "检查后端 API..."
if curl -f http://localhost:45000/health > /dev/null 2>&1; then
    echo "✅ 后端 API 正常"
else
    echo "❌ 后端 API 异常"
    echo "📋 后端日志（最后10行）："
    docker logs recruitment-backend --tail=10
fi

# 检查前端
echo "检查前端服务..."
if curl -f http://localhost:43000/health > /dev/null 2>&1; then
    echo "✅ 前端服务正常"
else
    echo "❌ 前端服务异常"
    echo "📋 前端日志（最后10行）："
    docker logs recruitment-frontend --tail=10
fi

echo ""
echo "🎉 强制重建完成！"
echo "=================="
echo "🌐 访问地址："
echo "前端: http://localhost:43000"
echo "后端: http://localhost:45000"
echo ""
echo "📋 如果仍有问题："
echo "查看完整日志: docker compose -f docker-compose.working.yml logs"
echo "检查配置: docker compose -f docker-compose.working.yml config"