#!/bin/bash

# 快速修复编译错误并重新部署

echo "🔧 修复编译错误并重新部署"
echo "========================"

echo "✅ 已修复的 TypeScript 错误："
echo "- 移除未使用的 sendVerificationEmail 导入"
echo "- 修复上传中间件中的未使用参数"
echo "- 修复路由中的未使用参数"
echo "- 修复前端 radio 按钮类型问题"
echo "- 添加缺失的 success 状态变量"

echo ""
echo "🔨 重新构建后端..."
if docker compose build --no-cache backend; then
    echo "✅ 后端构建成功"
else
    echo "❌ 后端构建失败，查看错误："
    exit 1
fi

echo ""
echo "🔨 重新构建前端..."
if docker compose build --no-cache frontend; then
    echo "✅ 前端构建成功"
else
    echo "❌ 前端构建失败"
    exit 1
fi

echo ""
echo "🚀 启动服务..."
docker compose up -d

echo "⏳ 等待服务启动（30秒）..."
sleep 30

echo ""
echo "🔍 检查服务状态..."
docker compose ps

echo ""
echo "🏥 健康检查..."
echo -n "后端 API: "
if curl -f http://localhost:45000/health >/dev/null 2>&1; then
    echo "✅ 正常"
else
    echo "❌ 异常"
    echo "后端日志："
    docker logs recruitment-backend --tail=10
fi

echo -n "前端服务: "
if curl -f http://localhost:43000/health >/dev/null 2>&1; then
    echo "✅ 正常"
else
    echo "❌ 异常"
fi

echo -n "API 代理: "
if curl -f http://localhost:43000/api/health >/dev/null 2>&1; then
    echo "✅ 正常"
else
    echo "❌ 异常"
fi

echo ""
echo "🎉 修复完成！"
echo "============"
echo "🌐 访问地址："
echo "前端: http://localhost:43000"
echo "后端: http://localhost:45000"
echo "管理员配置: http://localhost:43000/admin/config"
echo ""
echo "📧 新功能："
echo "- 邮箱验证码注册"
echo "- 照片和附件上传"
echo "- 年级特定信息收集"
echo "- 管理员配置系统"