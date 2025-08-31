#!/bin/bash

# 彻底清理和重新部署脚本

set -e

echo "🧹 彻底清理和重新部署"
echo "===================="

echo "🛑 停止所有相关服务..."
docker compose down 2>/dev/null || true
docker compose -f docker-compose.working.yml down 2>/dev/null || true
docker compose -f docker-compose.arm.yml down 2>/dev/null || true

echo "🗑️  删除所有相关容器..."
docker container rm recruitment-mysql recruitment-redis recruitment-backend recruitment-frontend 2>/dev/null || true
docker container rm recruitment-mysql-clean recruitment-redis-clean recruitment-backend-clean recruitment-frontend-clean 2>/dev/null || true

echo "🌐 清理所有项目网络..."
docker network rm code-academy-recruitment_recruitment-network 2>/dev/null || true
docker network rm code-academy-recruitment_default 2>/dev/null || true

echo "🗑️  删除项目镜像..."
docker image rm code-academy-recruitment-backend code-academy-recruitment-frontend 2>/dev/null || true

echo "🧹 清理 Docker 缓存..."
docker system prune -f

echo "✅ 清理完成"

# 检查环境
if [ ! -f .env ]; then
    echo "📝 创建配置文件..."
    cp .env.example .env
    echo "⚠️  请编辑 .env 文件设置密码"
    read -p "按回车继续..."
fi

echo ""
echo "🚀 使用工作配置重新部署..."

# 确保使用正确的配置文件
COMPOSE_FILE="docker-compose.working.yml"

echo "📋 使用配置文件: $COMPOSE_FILE"

# 重新构建镜像
echo "🔨 重新构建所有镜像..."
docker compose -f $COMPOSE_FILE build --no-cache

echo "✅ 镜像构建完成"

# 分步启动服务
echo ""
echo "🚀 分步启动服务..."

echo "1️⃣ 启动 MySQL..."
docker compose -f $COMPOSE_FILE up -d mysql

echo "⏳ 等待 MySQL 启动（90秒）..."
for i in {1..18}; do
    if docker compose -f $COMPOSE_FILE ps mysql | grep -q "Up"; then
        if docker compose -f $COMPOSE_FILE exec mysql mysqladmin ping -h localhost -u root -p${DB_ROOT_PASSWORD:-root_password} 2>/dev/null; then
            echo "✅ MySQL 启动成功 ($i/18)"
            break
        fi
    fi
    echo "⏳ MySQL 启动中... ($i/18)"
    sleep 5
done

echo "2️⃣ 启动 Redis..."
docker compose -f $COMPOSE_FILE up -d redis
sleep 10

echo "3️⃣ 启动后端..."
docker compose -f $COMPOSE_FILE up -d backend
sleep 20

echo "4️⃣ 启动前端..."
docker compose -f $COMPOSE_FILE up -d frontend
sleep 15

echo ""
echo "🔍 检查最终状态..."

# 检查容器状态
echo "📊 容器状态:"
docker compose -f $COMPOSE_FILE ps

# 检查网络
echo ""
echo "🌐 网络信息:"
if docker network inspect code-academy-recruitment_recruitment-network >/dev/null 2>&1; then
    echo "项目网络存在，容器 IP 分配:"
    docker network inspect code-academy-recruitment_recruitment-network --format '{{range .Containers}}{{.Name}}: {{.IPv4Address}}{{"\n"}}{{end}}'
else
    echo "❌ 项目网络不存在"
fi

# 检查服务连通性
echo ""
echo "🔗 服务连通性测试:"

if docker ps --filter "name=recruitment-backend" --format "{{.Names}}" | grep -q recruitment-backend; then
    echo "后端容器网络测试:"
    docker exec recruitment-backend ping -c 1 mysql >/dev/null 2>&1 && echo "✅ 后端 -> MySQL" || echo "❌ 后端 -> MySQL"
    docker exec recruitment-backend ping -c 1 redis >/dev/null 2>&1 && echo "✅ 后端 -> Redis" || echo "❌ 后端 -> Redis"
    
    echo "后端 API 测试:"
    docker exec recruitment-backend curl -f http://localhost:5000/health >/dev/null 2>&1 && echo "✅ 后端内部 API" || echo "❌ 后端内部 API"
fi

if docker ps --filter "name=recruitment-frontend" --format "{{.Names}}" | grep -q recruitment-frontend; then
    echo "前端容器网络测试:"
    docker exec recruitment-frontend ping -c 1 recruitment-backend >/dev/null 2>&1 && echo "✅ 前端 -> 后端" || echo "❌ 前端 -> 后端"
fi

# 外部访问测试
echo ""
echo "🌐 外部访问测试:"
curl -f http://localhost:45000/health >/dev/null 2>&1 && echo "✅ 主机 -> 后端 API" || echo "❌ 主机 -> 后端 API"
curl -f http://localhost:43000/health >/dev/null 2>&1 && echo "✅ 主机 -> 前端" || echo "❌ 主机 -> 前端"
curl -f http://localhost:43000/api/health >/dev/null 2>&1 && echo "✅ 前端代理 -> 后端" || echo "❌ 前端代理 -> 后端"

echo ""
echo "🎉 清理重部署完成！"
echo "=================="
echo "🌐 访问地址:"
echo "前端: http://localhost:43000"
echo "后端: http://localhost:45000"
echo "前端代理API: http://localhost:43000/api/health"
echo ""
echo "📋 管理命令:"
echo "查看状态: docker compose -f $COMPOSE_FILE ps"
echo "查看日志: docker compose -f $COMPOSE_FILE logs -f"
echo "网络诊断: ./debug-network.sh"