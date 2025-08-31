#!/bin/bash

# MySQL 重启循环修复脚本

set -e

echo "🔧 MySQL 重启循环修复"
echo "===================="

echo "🛑 停止所有服务..."
docker compose down 2>/dev/null || true
docker compose -f docker-compose.arm.yml down 2>/dev/null || true
docker compose -f docker-compose.simple.yml down 2>/dev/null || true

echo "🧹 清理 MySQL 容器和数据..."
docker container rm recruitment-mysql 2>/dev/null || true

# 询问是否重置数据
echo ""
read -p "是否重置 MySQL 数据卷？这会删除所有数据 (y/N): " reset_data

if [[ $reset_data == "y" || $reset_data == "Y" ]]; then
    echo "🗑️  删除 MySQL 数据卷..."
    docker volume rm code-academy-recruitment_mysql_data 2>/dev/null || true
    echo "✅ 数据卷已重置"
else
    echo "ℹ️  保留现有数据卷"
fi

echo ""
echo "🔍 检查环境配置..."

# 检查 .env 文件
if [ ! -f .env ]; then
    echo "📝 创建 .env 文件..."
    cp .env.example .env
    echo "⚠️  请设置数据库密码："
    echo "   DB_PASSWORD=your_strong_password"
    echo "   DB_ROOT_PASSWORD=your_root_password"
    echo ""
    read -p "按回车继续..."
fi

# 显示当前数据库配置
echo "📋 当前数据库配置："
grep -E "DB_|MYSQL_" .env 2>/dev/null || echo "未找到数据库配置"

echo ""
echo "🚀 使用最小化配置启动 MySQL..."

# 先只启动 MySQL
docker compose -f docker-compose.minimal.yml up -d mysql

echo "⏳ 等待 MySQL 初始化（这可能需要几分钟）..."

# 监控 MySQL 启动过程
for i in {1..12}; do
    echo "检查第 $i 次..."
    
    # 检查容器状态
    if docker ps --filter "name=recruitment-mysql" --format "{{.Status}}" | grep -q "Up"; then
        echo "✅ MySQL 容器运行中"
        
        # 检查健康状态
        if docker compose -f docker-compose.minimal.yml exec mysql mysqladmin ping -h localhost -u root -p${DB_ROOT_PASSWORD:-root_password} 2>/dev/null; then
            echo "✅ MySQL 服务健康"
            break
        else
            echo "⏳ MySQL 仍在初始化..."
        fi
    else
        echo "❌ MySQL 容器未运行"
        echo "📋 容器状态："
        docker ps -a --filter "name=recruitment-mysql" --format "table {{.Names}}\t{{.Status}}"
        echo ""
        echo "📋 最新日志："
        docker logs --tail=10 recruitment-mysql 2>/dev/null || echo "无法获取日志"
    fi
    
    sleep 15
done

# 检查最终状态
echo ""
echo "🔍 最终检查..."

if docker compose -f docker-compose.minimal.yml ps mysql | grep -q "Up"; then
    echo "✅ MySQL 启动成功！"
    
    echo ""
    echo "🚀 启动其他服务..."
    docker compose -f docker-compose.minimal.yml up -d
    
    echo "⏳ 等待所有服务启动..."
    sleep 30
    
    echo "📊 服务状态："
    docker compose -f docker-compose.minimal.yml ps
    
else
    echo "❌ MySQL 启动失败"
    echo ""
    echo "📋 详细错误信息："
    docker logs recruitment-mysql
    echo ""
    echo "🔧 建议的解决方案："
    echo "1. 检查磁盘空间: df -h"
    echo "2. 检查内存: free -h"
    echo "3. 重置数据卷: docker volume rm code-academy-recruitment_mysql_data"
    echo "4. 使用不同的 MySQL 配置"
    echo ""
    echo "🆘 紧急方案 - 使用外部 MySQL："
    echo "1. 安装本地 MySQL: sudo apt install mysql-server"
    echo "2. 修改 .env 文件: DB_HOST=localhost"
    echo "3. 只启动应用服务: docker compose up backend frontend"
fi