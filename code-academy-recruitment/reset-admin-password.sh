#!/bin/bash

# 重置管理员密码

echo "🔑 重置管理员密码"
echo "================"

echo "📋 当前配置:"
echo "管理员邮箱: admin@dmsy.me"
echo "新密码: 741236985ZHjd~"

echo ""
echo "🗑️  删除现有管理员用户..."
docker exec recruitment-mysql mysql -u root -p${DB_ROOT_PASSWORD:-root_password} << 'EOF'
USE recruitment_db;
DELETE FROM users WHERE email='admin@dmsy.me';
SELECT '管理员用户已删除' as result;
EOF

echo ""
echo "🚀 重启后端，重新创建管理员..."
docker compose restart backend

echo ""
echo "⏳ 等待后端启动（15秒）..."
sleep 15

echo ""
echo "📋 查看管理员创建日志..."
docker logs recruitment-backend --tail=20 | grep -A 5 "创建默认管理员用户"

echo ""
echo "✅ 管理员密码重置完成！"
echo ""
echo "🎯 现在可以使用以下账号登录:"
echo "邮箱: admin@dmsy.me"
echo "密码: 741236985ZHjd~"
echo "登录地址: http://localhost:43000/login"