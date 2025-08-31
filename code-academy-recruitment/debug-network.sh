#!/bin/bash

# Docker 网络诊断脚本

echo "🌐 Docker 网络诊断"
echo "=================="

# 检查容器状态
echo "📊 容器状态:"
docker compose -f docker-compose.working.yml ps

echo ""
echo "🔍 详细容器信息:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}\t{{.Networks}}"

# 检查网络
echo ""
echo "🌐 Docker 网络:"
docker network ls

echo ""
echo "🔍 项目网络详情:"
if docker network inspect code-academy-recruitment_recruitment-network >/dev/null 2>&1; then
    docker network inspect code-academy-recruitment_recruitment-network --format '{{range .Containers}}{{.Name}}: {{.IPv4Address}}{{"\n"}}{{end}}'
else
    echo "❌ 项目网络不存在"
fi

# 检查容器网络连接
echo ""
echo "🔗 容器网络连接测试:"

if docker ps --filter "name=recruitment-backend" --format "{{.Names}}" | grep -q recruitment-backend; then
    echo "后端容器网络信息:"
    docker inspect recruitment-backend --format '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}'
    
    echo "从后端容器测试连接:"
    docker exec recruitment-backend ping -c 1 mysql 2>/dev/null && echo "✅ 后端 -> MySQL 连通" || echo "❌ 后端 -> MySQL 不通"
    docker exec recruitment-backend ping -c 1 redis 2>/dev/null && echo "✅ 后端 -> Redis 连通" || echo "❌ 后端 -> Redis 不通"
else
    echo "❌ 后端容器未运行"
fi

if docker ps --filter "name=recruitment-frontend" --format "{{.Names}}" | grep -q recruitment-frontend; then
    echo "前端容器网络信息:"
    docker inspect recruitment-frontend --format '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}'
    
    echo "从前端容器测试连接:"
    docker exec recruitment-frontend ping -c 1 recruitment-backend 2>/dev/null && echo "✅ 前端 -> 后端 连通" || echo "❌ 前端 -> 后端 不通"
else
    echo "❌ 前端容器未运行"
fi

# 检查端口监听
echo ""
echo "🔌 端口监听状态:"
echo "主机端口:"
netstat -tlnp 2>/dev/null | grep -E ":(43000|45000|43306|46379)" || echo "无相关端口监听"

echo ""
echo "容器内端口:"
if docker ps --filter "name=recruitment-backend" --format "{{.Names}}" | grep -q recruitment-backend; then
    echo "后端容器端口:"
    docker exec recruitment-backend netstat -tln 2>/dev/null | grep :5000 || echo "后端端口5000未监听"
fi

# 测试 API 访问
echo ""
echo "🧪 API 访问测试:"

echo "直接访问后端容器:"
if docker ps --filter "name=recruitment-backend" --format "{{.Names}}" | grep -q recruitment-backend; then
    docker exec recruitment-backend curl -f http://localhost:5000/health 2>/dev/null && echo "✅ 后端容器内部访问正常" || echo "❌ 后端容器内部访问失败"
fi

echo "通过主机端口访问:"
curl -f http://localhost:45000/health 2>/dev/null && echo "✅ 主机端口访问正常" || echo "❌ 主机端口访问失败"

echo "通过前端代理访问:"
curl -f http://localhost:43000/api/health 2>/dev/null && echo "✅ 前端代理访问正常" || echo "❌ 前端代理访问失败"

echo ""
echo "🔧 修复建议:"
echo "1. 如果容器没有 IP，重新创建网络:"
echo "   docker network rm code-academy-recruitment_recruitment-network"
echo "   docker compose -f docker-compose.working.yml up -d"
echo ""
echo "2. 如果后端端口未监听，检查后端日志:"
echo "   docker logs recruitment-backend"
echo ""
echo "3. 如果前端代理失败，重建前端镜像:"
echo "   docker compose -f docker-compose.working.yml build --no-cache frontend"