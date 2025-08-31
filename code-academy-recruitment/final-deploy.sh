#!/bin/bash

# 代码书院 - 最终部署脚本（修复所有问题后）

set -e

echo "🎯 代码书院实验室纳新系统 - 最终部署"
echo "===================================="

# 检测架构
ARCH=$(uname -m)
COMPOSE_FILE="docker-compose.yml"

if [[ "$ARCH" == "aarch64" ]] || [[ "$ARCH" == "arm64" ]] || [[ "$ARCH" == "armv7l" ]]; then
    echo "🔧 检测到 ARM64 架构，使用优化配置"
    COMPOSE_FILE="docker-compose.arm.yml"
else
    echo "🔧 检测到 x86_64 架构，使用标准配置"
fi

# 检查环境
echo "🔍 检查部署环境..."

if ! command -v docker &> /dev/null; then
    echo "❌ Docker 未安装"
    exit 1
fi

if ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose V2 未安装"
    exit 1
fi

if [ ! -f .env ]; then
    echo "📝 创建配置文件..."
    cp .env.example .env
    echo "⚠️  请编辑 .env 文件配置必要参数："
    echo "   - DB_PASSWORD (数据库密码)"
    echo "   - REDIS_PASSWORD (Redis密码)"  
    echo "   - JWT_SECRET (JWT密钥)"
    echo "   - EMAIL_* (邮箱配置)"
    echo "   - ALLOWED_EMAIL_DOMAIN (邮箱域名)"
    echo ""
    read -p "配置完成后按回车继续..."
fi

echo "✅ 环境检查通过"

# 清理旧容器
echo "🧹 清理旧容器..."
docker compose -f $COMPOSE_FILE down 2>/dev/null || true

# 测试构建
echo "🔨 测试代码编译..."

echo "   测试后端编译..."
if ! (cd backend && npm run build); then
    echo "❌ 后端编译失败！请检查 TypeScript 错误"
    exit 1
fi

echo "   测试前端编译..."
if ! (cd frontend && npm run build); then
    echo "❌ 前端编译失败！请检查 React 错误"
    exit 1
fi

echo "✅ 代码编译测试通过"

# 构建 Docker 镜像
echo "🐳 构建 Docker 镜像..."
if ! docker compose -f $COMPOSE_FILE build; then
    echo "❌ Docker 镜像构建失败！"
    exit 1
fi

echo "✅ Docker 镜像构建成功"

# 启动服务
echo "🚀 启动服务..."
docker compose -f $COMPOSE_FILE up -d

# 等待服务启动
echo "⏳ 等待服务启动..."
if [[ "$ARCH" == "aarch64" ]] || [[ "$ARCH" == "arm64" ]] || [[ "$ARCH" == "armv7l" ]]; then
    echo "   ARM 设备启动较慢，请耐心等待..."
    sleep 45
else
    sleep 25
fi

# 检查服务状态
echo "🔍 检查服务状态..."
docker compose -f $COMPOSE_FILE ps

# 健康检查
echo "🏥 执行健康检查..."

# 检查 MySQL
if docker compose -f $COMPOSE_FILE exec mysql mysqladmin ping -h localhost -u recruitment_user -p\${DB_PASSWORD:-your_secure_password} --silent 2>/dev/null; then
    echo "✅ MySQL 数据库正常"
else
    echo "❌ MySQL 数据库异常"
    docker compose -f $COMPOSE_FILE logs mysql
fi

# 检查后端
sleep 5
if curl -f http://localhost:45000/health > /dev/null 2>&1; then
    echo "✅ 后端 API 正常"
else
    echo "❌ 后端 API 异常"
    docker compose -f $COMPOSE_FILE logs backend
fi

# 检查前端
if curl -f http://localhost:43000 > /dev/null 2>&1; then
    echo "✅ 前端服务正常"
else
    echo "❌ 前端服务异常"
    docker compose -f $COMPOSE_FILE logs frontend
fi

echo ""
echo "🎉 部署完成！"
echo "===================================="
echo "🌐 访问地址："
echo "前端界面: http://$(hostname -I | awk '{print $1}' 2>/dev/null || echo 'localhost'):43000"
echo "后端 API: http://$(hostname -I | awk '{print $1}' 2>/dev/null || echo 'localhost'):45000"
echo ""
echo "🔧 本地访问："
echo "前端: http://localhost:43000"
echo "后端: http://localhost:45000"
echo "MySQL: localhost:43306"
echo "Redis: localhost:46379"
echo ""
echo "👤 默认管理员："
echo "邮箱: 查看 .env 文件中的 ADMIN_EMAIL"
echo "密码: 查看 .env 文件中的 ADMIN_PASSWORD"
echo ""
echo "📋 管理命令："
echo "查看状态: docker compose -f $COMPOSE_FILE ps"
echo "查看日志: docker compose -f $COMPOSE_FILE logs -f"
echo "重启服务: docker compose -f $COMPOSE_FILE restart"
echo "停止服务: docker compose -f $COMPOSE_FILE down"
echo "备份数据: make backup"
echo "===================================="