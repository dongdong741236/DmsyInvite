#!/bin/bash

# 重建管理员账号

echo "🔧 重建管理员账号"
echo "================"

echo "📋 当前管理员配置:"
echo "ADMIN_EMAIL: admin@dmsy.me"
echo "ADMIN_PASSWORD: 741236985ZHjd~"

echo ""
echo "🗑️  删除现有管理员账号（如果存在）..."
docker exec recruitment-mysql mysql -u root -p${DB_ROOT_PASSWORD:-root_password} << 'EOF'
USE recruitment_db;
DELETE FROM users WHERE email='admin@dmsy.me';
SELECT '删除完成' as result;
EOF

echo ""
echo "🔨 重新构建后端..."
docker compose build --no-cache backend

echo ""
echo "🚀 重启后端服务..."
docker compose restart backend

echo ""
echo "⏳ 等待后端启动（20秒）..."
sleep 20

echo ""
echo "📋 查看管理员创建日志..."
docker logs recruitment-backend | grep -A 10 "创建默认管理员用户"

echo ""
echo "🔍 验证管理员账号..."
docker exec recruitment-mysql mysql -u root -p${DB_ROOT_PASSWORD:-root_password} << 'EOF'
USE recruitment_db;
SELECT email, name, role, isEmailVerified FROM users WHERE role='admin';
EOF

echo ""
echo "✅ 管理员账号重建完成！"
echo ""
echo "🎯 现在可以使用以下账号登录:"
echo "邮箱: admin@dmsy.me"
echo "密码: 741236985ZHjd~"
echo "登录地址: http://localhost:43000/login"