#!/bin/bash

# 测试新功能的脚本

echo "🧪 测试新增功能"
echo "=============="

# 检查服务状态
echo "🔍 检查服务状态..."
if ! curl -f http://localhost:45000/health >/dev/null 2>&1; then
    echo "❌ 后端服务未运行，请先启动服务"
    echo "运行: ./deploy.sh install 或 ./fix-compile.sh"
    exit 1
fi

echo "✅ 后端服务正常"

# 测试邮箱验证码功能
echo ""
echo "📧 测试邮箱验证码功能..."
./test-email-verification.sh

# 测试申请配置接口
echo ""
echo "⚙️ 测试申请配置接口..."
CONFIG_RESPONSE=$(curl -s http://localhost:45000/api/applications/config)
echo "申请配置响应: $CONFIG_RESPONSE"

if echo "$CONFIG_RESPONSE" | grep -q "freshmanEnabled"; then
    echo "✅ 申请配置接口正常"
else
    echo "❌ 申请配置接口异常"
fi

# 测试管理员配置接口
echo ""
echo "👨‍💼 测试管理员配置接口..."

# 需要管理员 token，这里只测试接口是否存在
ADMIN_CONFIG_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:45000/api/admin/configs)
if [ "$ADMIN_CONFIG_RESPONSE" = "401" ]; then
    echo "✅ 管理员配置接口存在（需要认证）"
else
    echo "❌ 管理员配置接口异常: HTTP $ADMIN_CONFIG_RESPONSE"
fi

# 测试文件上传目录
echo ""
echo "📁 测试文件上传目录..."
if docker exec recruitment-backend ls -la /app/uploads 2>/dev/null; then
    echo "✅ 上传目录存在"
else
    echo "❌ 上传目录不存在"
fi

# 测试前端页面
echo ""
echo "🌐 测试前端页面..."

echo "测试注册页面:"
if curl -s http://localhost:43000/register | grep -q "验证邮箱"; then
    echo "✅ 新注册页面正常"
else
    echo "❌ 新注册页面异常"
fi

echo "测试申请页面:"
if curl -s http://localhost:43000/applications/new | grep -q "提交申请"; then
    echo "✅ 新申请页面正常"
else
    echo "❌ 新申请页面异常"
fi

# 测试 API 代理
echo ""
echo "🔗 测试 API 代理..."
if curl -f http://localhost:43000/api/health >/dev/null 2>&1; then
    echo "✅ API 代理正常"
    echo "代理响应: $(curl -s http://localhost:43000/api/health)"
else
    echo "❌ API 代理异常"
fi

echo ""
echo "📊 新功能总结:"
echo "=============="
echo "✅ 邮箱验证码注册功能"
echo "✅ 文件上传支持（照片和附件）"
echo "✅ 年级特定信息收集"
echo "✅ 管理员配置系统"
echo "✅ API 代理转发"

echo ""
echo "🎯 访问地址:"
echo "前端: http://localhost:43000"
echo "注册: http://localhost:43000/register"
echo "申请: http://localhost:43000/applications/new"
echo "管理: http://localhost:43000/admin"
echo "配置: http://localhost:43000/admin/config"

echo ""
echo "📧 使用提醒:"
echo "1. 请确保配置了邮箱服务器（.env 文件）"
echo "2. 新用户需要通过验证码注册"
echo "3. 申请支持照片和附件上传"
echo "4. 管理员可以配置纳新开关和时间"