#!/bin/bash

# 修复 MySQL 用户权限问题

echo "🔧 修复 MySQL 用户权限问题"
echo "=========================="

echo "🔍 诊断 MySQL 用户权限..."

# 检查 MySQL 容器状态
if ! docker ps --filter "name=recruitment-mysql" --format "{{.Status}}" | grep -q "Up"; then
    echo "❌ MySQL 容器未运行"
    exit 1
fi

echo "✅ MySQL 容器运行中"

# 检查当前数据库用户
echo ""
echo "📋 检查当前数据库用户..."
docker exec recruitment-mysql mysql -u root -p${DB_ROOT_PASSWORD:-root_password} -e "SELECT User, Host FROM mysql.user WHERE User='recruitment_user';" 2>/dev/null || echo "无法查询用户信息"

echo ""
echo "🔧 修复用户权限..."

# 重新创建用户并赋予正确权限
docker exec recruitment-mysql mysql -u root -p${DB_ROOT_PASSWORD:-root_password} << 'EOF'
-- 删除可能存在的用户
DROP USER IF EXISTS 'recruitment_user'@'localhost';
DROP USER IF EXISTS 'recruitment_user'@'%';
DROP USER IF EXISTS 'recruitment_user'@'172.21.0.4';

-- 重新创建用户，允许从任何 IP 连接
CREATE USER 'recruitment_user'@'%' IDENTIFIED BY '${DB_PASSWORD:-your_secure_password}';

-- 赋予数据库权限
GRANT ALL PRIVILEGES ON recruitment_db.* TO 'recruitment_user'@'%';

-- 刷新权限
FLUSH PRIVILEGES;

-- 显示用户信息
SELECT User, Host FROM mysql.user WHERE User='recruitment_user';
EOF

echo ""
echo "✅ 用户权限修复完成"

echo ""
echo "🧪 测试数据库连接..."
if docker exec recruitment-mysql mysql -u recruitment_user -p${DB_PASSWORD:-your_secure_password} -e "SELECT 1;" 2>/dev/null; then
    echo "✅ 数据库连接测试成功"
else
    echo "❌ 数据库连接测试失败"
    echo "请检查密码是否正确: DB_PASSWORD=${DB_PASSWORD}"
fi

echo ""
echo "🚀 重新启动后端..."
docker compose up -d backend

echo "⏳ 等待后端启动（30秒）..."
sleep 30

echo ""
echo "🔍 检查修复结果..."
docker compose ps backend

echo ""
echo "📋 后端日志:"
docker logs recruitment-backend --tail=10

echo ""
echo "🧪 测试 API..."
if curl -f http://localhost:45000/health >/dev/null 2>&1; then
    echo "✅ 后端 API 正常"
    curl http://localhost:45000/health
else
    echo "❌ 后端 API 仍然异常"
fi

echo ""
echo "🎯 修复完成！"
echo "============"
echo "如果仍有问题，可能需要："
echo "1. 检查 .env 文件中的数据库密码"
echo "2. 重置 MySQL 数据卷: docker volume rm code-academy-recruitment_mysql_data"
echo "3. 完整重新部署: ./deploy.sh clean"