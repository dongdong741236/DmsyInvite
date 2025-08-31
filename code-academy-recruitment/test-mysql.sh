#!/bin/bash

# MySQL 独立测试脚本

echo "🧪 MySQL 独立测试"
echo "================"

# 停止所有相关容器
echo "🛑 停止现有容器..."
docker stop recruitment-mysql recruitment-mysql-clean 2>/dev/null || true
docker rm recruitment-mysql recruitment-mysql-clean 2>/dev/null || true

# 测试1: 最简单的 MySQL 容器
echo ""
echo "🧪 测试1: 基础 MySQL 容器"
echo "========================"

docker run -d \
  --name mysql-test \
  -e MYSQL_ROOT_PASSWORD=root123 \
  -e MYSQL_DATABASE=testdb \
  -p 43307:3306 \
  mysql:8.0

echo "⏳ 等待 MySQL 启动（60秒）..."
sleep 60

echo "🔍 检查基础 MySQL..."
if docker exec mysql-test mysqladmin ping -h localhost -u root -proot123 2>/dev/null; then
    echo "✅ 基础 MySQL 测试成功"
    
    # 测试数据库创建
    echo "🔍 测试数据库操作..."
    docker exec mysql-test mysql -u root -proot123 -e "SHOW DATABASES;" 2>/dev/null && echo "✅ 数据库查询成功"
    
    # 清理测试容器
    docker stop mysql-test && docker rm mysql-test
    echo "✅ 基础测试通过，清理测试容器"
else
    echo "❌ 基础 MySQL 测试失败"
    echo "📋 错误日志："
    docker logs mysql-test
    docker stop mysql-test && docker rm mysql-test
    exit 1
fi

# 测试2: 使用配置文件的 MySQL
echo ""
echo "🧪 测试2: 带配置的 MySQL"
echo "======================"

# 加载环境变量
if [ -f .env ]; then
    export $(cat .env | grep -v '#' | grep -v '^$' | xargs)
fi

echo "📝 使用的配置："
echo "   数据库名: ${DB_NAME:-recruitment_db}"
echo "   用户名: ${DB_USER:-recruitment_user}"
echo "   Root密码: ${DB_ROOT_PASSWORD:-root_password}"

# 使用纯净配置启动
docker compose -f docker-compose.clean.yml up -d mysql

echo "⏳ 等待配置版 MySQL 启动（90秒）..."

# 监控启动过程
for i in {1..18}; do
    echo "检查 $i/18..."
    
    if docker ps --filter "name=recruitment-mysql-clean" --format "{{.Status}}" | grep -q "Up"; then
        if docker compose -f docker-compose.clean.yml exec mysql mysqladmin ping -h localhost -u root -p${DB_ROOT_PASSWORD:-root_password} 2>/dev/null; then
            echo "✅ 配置版 MySQL 启动成功！"
            
            echo "🔍 验证数据库..."
            docker compose -f docker-compose.clean.yml exec mysql mysql -u root -p${DB_ROOT_PASSWORD:-root_password} -e "SHOW DATABASES;" 2>/dev/null
            
            echo ""
            echo "🎉 MySQL 测试完全成功！"
            echo "可以使用以下命令启动完整系统："
            echo "docker compose -f docker-compose.clean.yml up -d"
            exit 0
        fi
    else
        echo "❌ 容器未运行，查看状态："
        docker ps -a --filter "name=recruitment-mysql-clean"
    fi
    
    sleep 5
done

echo "❌ 配置版 MySQL 启动失败"
echo ""
echo "📋 详细日志："
docker logs recruitment-mysql-clean

echo ""
echo "🔧 可能的解决方案："
echo "1. 磁盘空间不足: df -h"
echo "2. 内存不足: free -h"  
echo "3. 权限问题: ls -la /var/lib/docker/volumes/"
echo "4. 端口冲突: netstat -tlnp | grep 3306"

# 清理测试容器
docker compose -f docker-compose.clean.yml down