#!/bin/bash

# 检查后端启动状态的详细脚本

echo "🔍 后端启动状态检查"
echo "=================="

echo "📊 容器基本信息:"
docker ps --filter "name=recruitment-backend" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo ""
echo "📋 后端详细日志:"
echo "=================="
docker logs recruitment-backend

echo ""
echo "🔍 后端进程检查:"
if docker exec recruitment-backend ps aux 2>/dev/null; then
    echo "✅ 后端容器可执行命令"
else
    echo "❌ 后端容器无法执行命令"
fi

echo ""
echo "🌐 后端网络检查:"
echo "容器 IP 地址:"
docker inspect recruitment-backend --format '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}'

echo ""
echo "端口监听状态:"
if docker exec recruitment-backend netstat -tln 2>/dev/null; then
    echo "端口监听正常"
else
    echo "无法检查端口监听，尝试其他方法:"
    docker exec recruitment-backend ss -tln 2>/dev/null || echo "无法检查端口"
fi

echo ""
echo "🧪 连接测试:"
echo "测试后端内部健康检查:"
docker exec recruitment-backend curl -v http://localhost:5000/health 2>&1 || echo "内部健康检查失败"

echo ""
echo "测试数据库连接:"
if docker exec recruitment-backend ping -c 1 mysql >/dev/null 2>&1; then
    echo "✅ 可以 ping 通 MySQL"
else
    echo "❌ 无法 ping 通 MySQL"
    echo "尝试使用 IP 直接连接:"
    MYSQL_IP=$(docker inspect recruitment-mysql --format '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}')
    echo "MySQL IP: $MYSQL_IP"
    docker exec recruitment-backend ping -c 1 $MYSQL_IP 2>/dev/null && echo "✅ IP 连接成功" || echo "❌ IP 连接失败"
fi

echo ""
echo "🔧 后端环境变量检查:"
echo "数据库配置:"
docker exec recruitment-backend env | grep -E "DB_|NODE_ENV|PORT" || echo "无法获取环境变量"

echo ""
echo "📁 后端文件检查:"
echo "应用文件:"
docker exec recruitment-backend ls -la /app/ 2>/dev/null || echo "无法查看应用文件"

echo "Node.js 版本:"
docker exec recruitment-backend node --version 2>/dev/null || echo "Node.js 未安装或无法访问"

echo ""
echo "🚨 诊断结果:"
if docker logs recruitment-backend 2>&1 | grep -q "Server running on port"; then
    echo "✅ 后端应用已启动"
elif docker logs recruitment-backend 2>&1 | grep -q "Database connection"; then
    echo "⏳ 后端正在连接数据库"
elif docker logs recruitment-backend 2>&1 | grep -q "Error"; then
    echo "❌ 后端启动有错误"
    echo "错误信息:"
    docker logs recruitment-backend 2>&1 | grep "Error" | tail -5
else
    echo "❓ 后端状态不明，查看完整日志"
fi