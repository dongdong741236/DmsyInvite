#!/bin/bash

# 修复所有已知问题的最终部署脚本

set -e

echo "🎯 代码书院 - 修复版部署"
echo "======================"

# 停止所有现有服务
echo "🛑 停止所有现有服务..."
docker compose down 2>/dev/null || true
docker compose -f docker-compose.arm.yml down 2>/dev/null || true
docker compose -f docker-compose.simple.yml down 2>/dev/null || true
docker compose -f docker-compose.clean.yml down 2>/dev/null || true

# 清理容器
echo "🧹 清理现有容器..."
docker container rm recruitment-mysql recruitment-redis recruitment-backend recruitment-frontend 2>/dev/null || true

# 检查配置
if [ ! -f .env ]; then
    echo "📝 创建配置文件..."
    cp .env.example .env
    echo "⚠️  请编辑 .env 文件设置密码"
    echo ""
    read -p "配置完成后按回车继续..."
fi

echo "🔍 使用工作版配置: docker-compose.working.yml"
echo "   - 修复了 MySQL2 连接配置警告"
echo "   - 移除了 Nginx Brotli 模块依赖"
echo "   - 使用最稳定的参数"

# 分步启动
echo ""
echo "🚀 分步启动服务..."

echo "1️⃣ 启动 MySQL（可能需要几分钟）..."
docker compose -f docker-compose.working.yml up -d mysql

echo "⏳ 等待 MySQL 完全启动..."
for i in {1..20}; do
    if docker compose -f docker-compose.working.yml ps mysql | grep -q "healthy"; then
        echo "✅ MySQL 启动成功！"
        break
    elif docker compose -f docker-compose.working.yml ps mysql | grep -q "Up"; then
        echo "⏳ MySQL 启动中... ($i/20)"
    else
        echo "❌ MySQL 启动失败"
        echo "📋 MySQL 日志："
        docker logs recruitment-mysql --tail=20
        exit 1
    fi
    sleep 15
done

echo "2️⃣ 启动 Redis..."
docker compose -f docker-compose.working.yml up -d redis
sleep 10

echo "3️⃣ 启动后端..."
docker compose -f docker-compose.working.yml up -d backend
sleep 20

echo "4️⃣ 启动前端..."
docker compose -f docker-compose.working.yml up -d frontend
sleep 15

# 最终检查
echo ""
echo "🔍 最终状态检查..."
docker compose -f docker-compose.working.yml ps

echo ""
echo "🏥 健康检查..."

# 检查后端
if curl -f http://localhost:45000/health > /dev/null 2>&1; then
    echo "✅ 后端 API 正常"
else
    echo "❌ 后端 API 异常"
    echo "📋 后端日志："
    docker logs recruitment-backend --tail=10
fi

# 检查前端
if curl -f http://localhost:43000/health > /dev/null 2>&1; then
    echo "✅ 前端服务正常"
else
    echo "❌ 前端服务异常"
    echo "📋 前端日志："
    docker logs recruitment-frontend --tail=10
fi

echo ""
echo "🎉 部署完成！"
echo "============="
echo "🌐 访问地址："
echo "前端: http://localhost:43000"
echo "后端: http://localhost:45000"
echo ""
echo "📋 管理命令："
echo "查看状态: docker compose -f docker-compose.working.yml ps"
echo "查看日志: docker compose -f docker-compose.working.yml logs -f"
echo "重启服务: docker compose -f docker-compose.working.yml restart"
echo "停止服务: docker compose -f docker-compose.working.yml down"