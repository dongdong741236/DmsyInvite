#!/bin/bash

# 快速测试脚本

echo "⚡ 快速服务测试"
echo "=============="

echo "📊 当前容器状态:"
docker compose -f docker-compose.working.yml ps

echo ""
echo "🔍 快速连通性测试:"

# 测试 MySQL
echo -n "MySQL: "
if docker exec recruitment-mysql mysqladmin ping -h localhost -u root -p${DB_ROOT_PASSWORD:-root_password} >/dev/null 2>&1; then
    echo "✅ 正常"
else
    echo "❌ 异常"
fi

# 测试 Redis
echo -n "Redis: "
if docker exec recruitment-redis redis-cli ping >/dev/null 2>&1; then
    echo "✅ 正常"
else
    echo "❌ 异常"
fi

# 测试后端
echo -n "后端: "
if curl -f http://localhost:45000/health >/dev/null 2>&1; then
    echo "✅ 正常"
    curl http://localhost:45000/health
else
    echo "❌ 异常"
    echo "后端最新日志:"
    docker logs recruitment-backend --tail=5
fi

# 测试前端
echo -n "前端: "
if curl -f http://localhost:43000/health >/dev/null 2>&1; then
    echo "✅ 正常"
else
    echo "❌ 异常"
    echo "前端最新日志:"
    docker logs recruitment-frontend --tail=5
fi

# 测试前端代理
echo -n "前端代理: "
if curl -f http://localhost:43000/api/health >/dev/null 2>&1; then
    echo "✅ 正常"
else
    echo "❌ 异常"
fi

echo ""
echo "🎯 建议的下一步:"
if curl -f http://localhost:45000/health >/dev/null 2>&1; then
    echo "✅ 系统基本正常，可以使用了！"
    echo "前端访问: http://localhost:43000"
else
    echo "❌ 后端有问题，建议:"
    echo "1. 查看后端详细状态: ./check-backend-startup.sh"
    echo "2. 重启后端: ./restart-backend.sh"
    echo "3. 查看完整日志: docker logs recruitment-backend"
fi