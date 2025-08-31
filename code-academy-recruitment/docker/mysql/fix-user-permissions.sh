#!/bin/bash

# MySQL 用户权限修复脚本
# 这个脚本会在 MySQL 初始化时运行

echo "修复 MySQL 用户权限..."

# 等待 MySQL 服务完全启动
until mysqladmin ping -h localhost --silent; do
    echo "等待 MySQL 启动..."
    sleep 2
done

echo "MySQL 已启动，开始修复用户权限..."

# 使用 root 用户修复权限
mysql -u root -p"${MYSQL_ROOT_PASSWORD}" << 'EOF'
-- 删除可能存在的限制性用户
DROP USER IF EXISTS 'recruitment_user'@'localhost';
DROP USER IF EXISTS 'recruitment_user'@'127.0.0.1';

-- 重新创建用户，允许从任何 IP 连接
CREATE USER IF NOT EXISTS 'recruitment_user'@'%' IDENTIFIED BY 'your_secure_password';

-- 赋予数据库权限
GRANT ALL PRIVILEGES ON recruitment_db.* TO 'recruitment_user'@'%';

-- 刷新权限
FLUSH PRIVILEGES;

-- 显示用户权限（用于调试）
SELECT User, Host FROM mysql.user WHERE User='recruitment_user';
EOF

echo "MySQL 用户权限修复完成"