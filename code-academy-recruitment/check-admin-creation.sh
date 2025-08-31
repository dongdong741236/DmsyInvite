#!/bin/bash

# 检查管理员用户创建情况

echo "🔍 检查管理员用户创建情况"
echo "========================"

echo "📋 当前环境变量中的管理员配置:"
echo "ADMIN_EMAIL=admin@dmsy.me"
echo "ADMIN_PASSWORD=741236985ZHjd~"

echo ""
echo "📋 后端启动日志中的管理员相关信息:"
docker logs recruitment-backend 2>&1 | grep -i -A 3 -B 3 "admin\|管理员\|creating.*admin\|admin.*created"

echo ""
echo "🔍 检查数据库中的管理员用户:"
docker exec recruitment-mysql mysql -u root -p${DB_ROOT_PASSWORD:-root_password} << 'EOF'
USE recruitment_db;
SELECT email, name, role, isEmailVerified, createdAt FROM users WHERE role='admin';
EOF

echo ""
echo "🔍 检查所有用户:"
docker exec recruitment-mysql mysql -u root -p${DB_ROOT_PASSWORD:-root_password} << 'EOF'
USE recruitment_db;
SELECT email, name, role FROM users;
EOF

echo ""
echo "🔍 后端容器状态:"
docker compose ps backend

echo ""
echo "🧪 测试管理员登录 API:"
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:45000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@dmsy.me", "password": "741236985ZHjd~"}')

echo "登录响应: $LOGIN_RESPONSE"

if echo "$LOGIN_RESPONSE" | grep -q "token"; then
    echo "✅ 管理员登录成功"
else
    echo "❌ 管理员登录失败"
    
    echo ""
    echo "🔧 可能的原因:"
    echo "1. 管理员用户未创建"
    echo "2. 密码不匹配"
    echo "3. 用户角色不正确"
    
    echo ""
    echo "📞 建议的修复:"
    echo "1. 重启后端: docker compose restart backend"
    echo "2. 查看详细日志: docker logs recruitment-backend"
    echo "3. 手动创建管理员: ./rebuild-admin.sh"
fi