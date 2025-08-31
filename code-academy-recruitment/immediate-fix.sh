#!/bin/bash

# 立即修复当前运行中的问题

set -e

echo "⚡ 立即修复部署问题"
echo "=================="

# 停止所有服务
echo "🛑 停止所有服务..."
docker compose -f docker-compose.working.yml down

# 强制删除镜像，确保重建
echo "🗑️  删除旧镜像..."
docker image rm code-academy-recruitment-backend code-academy-recruitment-frontend 2>/dev/null || true

# 清理构建缓存
echo "🧹 清理 Docker 缓存..."
docker builder prune -f

echo "✅ 清理完成"

# 验证配置文件
echo "🔍 验证配置文件..."

echo "检查 nginx-simple.conf 是否存在:"
if [ -f "frontend/nginx-simple.conf" ]; then
    echo "✅ nginx-simple.conf 存在"
    echo "   大小: $(wc -c < frontend/nginx-simple.conf) 字节"
else
    echo "❌ nginx-simple.conf 不存在，创建中..."
    cp nginx-simple.conf frontend/ 2>/dev/null || echo "需要手动复制"
fi

echo "检查后端数据库配置:"
if grep -q "extra:" backend/src/config/database.ts; then
    echo "❌ 后端配置仍有 extra 选项，需要修复"
    echo "当前配置:"
    grep -A 5 "extra:" backend/src/config/database.ts
else
    echo "✅ 后端配置已清理"
fi

# 强制重新构建
echo ""
echo "🔨 强制重新构建镜像（无缓存）..."

echo "构建后端（无缓存）..."
docker compose -f docker-compose.working.yml build --no-cache backend

echo "构建前端（无缓存）..."
docker compose -f docker-compose.working.yml build --no-cache frontend

echo "✅ 重建完成"

# 启动服务
echo ""
echo "🚀 启动修复后的服务..."
docker compose -f docker-compose.working.yml up -d

echo "⏳ 等待服务启动（60秒）..."
sleep 60

# 检查结果
echo ""
echo "🔍 检查修复结果..."

echo "容器状态:"
docker compose -f docker-compose.working.yml ps

echo ""
echo "后端日志检查（查找警告）:"
if docker logs recruitment-backend 2>&1 | grep -q "Ignoring invalid configuration"; then
    echo "❌ 后端仍有配置警告"
    echo "最新日志:"
    docker logs recruitment-backend --tail=5
else
    echo "✅ 后端无配置警告"
fi

echo ""
echo "前端日志检查（查找 brotli 错误）:"
if docker logs recruitment-frontend 2>&1 | grep -q "unknown directive.*brotli"; then
    echo "❌ 前端仍有 brotli 错误"
    echo "最新日志:"
    docker logs recruitment-frontend --tail=5
else
    echo "✅ 前端无 brotli 错误"
fi

echo ""
echo "🏥 API 健康检查..."
if curl -f http://localhost:45000/health > /dev/null 2>&1; then
    echo "✅ 后端 API 正常"
    curl http://localhost:45000/health
else
    echo "❌ 后端 API 异常"
fi

echo ""
echo "🌐 前端页面检查..."
if curl -f http://localhost:43000/health > /dev/null 2>&1; then
    echo "✅ 前端页面正常"
else
    echo "❌ 前端页面异常"
fi

echo ""
echo "🎯 修复完成！"
echo "============="
echo "如果仍有问题，请运行:"
echo "docker compose -f docker-compose.working.yml logs"