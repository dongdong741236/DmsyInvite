#!/bin/bash

# 测试邮箱验证码功能

echo "📧 测试邮箱验证码功能"
echo "==================="

# 首先确保后端正常运行
echo "🔍 检查后端状态..."
if curl -f http://localhost:45000/health >/dev/null 2>&1; then
    echo "✅ 后端运行正常"
else
    echo "❌ 后端未运行，请先启动后端服务"
    echo "建议运行: ./fix-jsonb-and-test.sh"
    exit 1
fi

# 测试发送验证码接口
echo ""
echo "🧪 测试发送验证码接口..."

TEST_EMAIL="test@stu.example.edu.cn"

echo "发送验证码到: $TEST_EMAIL"
SEND_RESPONSE=$(curl -s -X POST http://localhost:45000/api/auth/send-verification-code \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$TEST_EMAIL\"}")

echo "响应: $SEND_RESPONSE"

if echo "$SEND_RESPONSE" | grep -q "验证码已发送"; then
    echo "✅ 验证码发送接口正常"
else
    echo "❌ 验证码发送失败"
    echo "可能原因:"
    echo "1. 邮箱配置未设置"
    echo "2. Redis 连接失败"
    echo "3. 邮箱域名验证失败"
fi

# 测试验证码验证接口（使用错误验证码）
echo ""
echo "🧪 测试验证码验证接口..."

echo "测试错误验证码:"
VERIFY_RESPONSE=$(curl -s -X POST http://localhost:45000/api/auth/verify-email-code \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$TEST_EMAIL\", \"code\": \"123456\"}")

echo "响应: $VERIFY_RESPONSE"

if echo "$VERIFY_RESPONSE" | grep -q "验证码错误\|验证码已过期"; then
    echo "✅ 验证码验证接口正常（正确拒绝错误验证码）"
else
    echo "❌ 验证码验证接口异常"
fi

# 测试注册接口（未验证邮箱）
echo ""
echo "🧪 测试注册接口（未验证邮箱）..."

REGISTER_RESPONSE=$(curl -s -X POST http://localhost:45000/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"test2@stu.example.edu.cn\", \"password\": \"password123\", \"name\": \"测试用户\"}")

echo "响应: $REGISTER_RESPONSE"

if echo "$REGISTER_RESPONSE" | grep -q "请先验证邮箱"; then
    echo "✅ 注册接口正确要求邮箱验证"
else
    echo "❌ 注册接口未正确验证邮箱"
fi

echo ""
echo "📊 API 接口总结:"
echo "================"
echo "✅ 发送验证码: POST /api/auth/send-verification-code"
echo "✅ 验证验证码: POST /api/auth/verify-email-code"
echo "✅ 注册用户: POST /api/auth/register (需要先验证邮箱)"

echo ""
echo "📋 前端使用流程:"
echo "1. 用户输入邮箱 → 调用发送验证码接口"
echo "2. 用户输入验证码 → 调用验证验证码接口"
echo "3. 验证成功后 → 填写其他信息并注册"

echo ""
echo "🔧 邮箱配置检查:"
echo "请确保 .env 文件中配置了邮箱服务器信息:"
echo "EMAIL_HOST=smtp.your-domain.com"
echo "EMAIL_USER=noreply@your-domain.com"
echo "EMAIL_PASS=your_email_password"

echo ""
echo "🎯 如果要测试完整流程:"
echo "1. 配置真实的邮箱服务器"
echo "2. 访问前端注册页面: http://localhost:43000/register"
echo "3. 使用真实邮箱进行注册测试"