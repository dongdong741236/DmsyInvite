#!/bin/bash

# 外部 MySQL 安装和配置脚本

set -e

echo "🗄️  外部 MySQL 设置"
echo "=================="

# 检测操作系统
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$NAME
else
    echo "❌ 无法检测操作系统"
    exit 1
fi

echo "📋 操作系统: $OS"

# 安装 MySQL
echo "📦 安装 MySQL 服务器..."

case $OS in
    *Ubuntu*|*Debian*)
        sudo apt update
        sudo apt install -y mysql-server
        ;;
    *CentOS*|*Red\ Hat*)
        sudo yum install -y mysql-server
        ;;
    *)
        echo "❌ 不支持的操作系统: $OS"
        exit 1
        ;;
esac

# 启动 MySQL 服务
echo "🚀 启动 MySQL 服务..."
sudo systemctl start mysql
sudo systemctl enable mysql

# 等待 MySQL 启动
echo "⏳ 等待 MySQL 启动..."
sleep 10

# 安全配置
echo "🔒 配置 MySQL 安全设置..."

# 读取配置
if [ -f .env ]; then
    export $(cat .env | grep -v '#' | grep -v '^$' | xargs)
fi

DB_NAME=${DB_NAME:-recruitment_db}
DB_USER=${DB_USER:-recruitment_user}
DB_PASSWORD=${DB_PASSWORD:-your_secure_password}

# 创建数据库和用户
echo "📝 创建数据库和用户..."

sudo mysql -e "
CREATE DATABASE IF NOT EXISTS $DB_NAME CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS '$DB_USER'@'localhost' IDENTIFIED BY '$DB_PASSWORD';
CREATE USER IF NOT EXISTS '$DB_USER'@'%' IDENTIFIED BY '$DB_PASSWORD';
GRANT ALL PRIVILEGES ON $DB_NAME.* TO '$DB_USER'@'localhost';
GRANT ALL PRIVILEGES ON $DB_NAME.* TO '$DB_USER'@'%';
FLUSH PRIVILEGES;
"

echo "✅ 数据库配置完成"

# 测试连接
echo "🔍 测试数据库连接..."
if mysql -u $DB_USER -p$DB_PASSWORD -e "USE $DB_NAME; SELECT 1;" 2>/dev/null; then
    echo "✅ 数据库连接测试成功"
else
    echo "❌ 数据库连接测试失败"
    exit 1
fi

# 更新 .env 配置
echo "📝 更新 .env 配置..."
sed -i "s/DB_HOST=mysql/DB_HOST=localhost/" .env
sed -i "s/DB_PORT=3306/DB_PORT=3306/" .env

echo "✅ 外部 MySQL 设置完成！"
echo ""
echo "📋 配置信息："
echo "数据库主机: localhost"
echo "数据库端口: 3306"
echo "数据库名称: $DB_NAME"
echo "用户名: $DB_USER"
echo ""
echo "🚀 现在可以启动应用服务："
echo "docker compose -f docker-compose.external-db.yml up -d"
echo ""
echo "📊 检查 MySQL 状态："
echo "sudo systemctl status mysql"