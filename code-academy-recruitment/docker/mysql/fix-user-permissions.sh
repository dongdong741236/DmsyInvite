#!/bin/bash

# MySQL 用户权限修复脚本
# 这个脚本会在 MySQL 初始化时运行

echo "修复 MySQL 用户权限..."

# 等待 MySQL 完全启动
sleep 10

# 使用 root 用户修复权限
mysql -u root -p"$MYSQL_ROOT_PASSWORD" << EOF
-- 删除可能存在的限制性用户
DROP USER IF EXISTS '$MYSQL_USER'@'localhost';
DROP USER IF EXISTS '$MYSQL_USER'@'127.0.0.1';

-- 重新创建用户，允许从任何 IP 连接
CREATE USER IF NOT EXISTS '$MYSQL_USER'@'%' IDENTIFIED BY '$MYSQL_PASSWORD';

-- 赋予数据库权限
GRANT ALL PRIVILEGES ON $MYSQL_DATABASE.* TO '$MYSQL_USER'@'%';

-- 刷新权限
FLUSH PRIVILEGES;

-- 显示用户权限（用于调试）
SELECT User, Host FROM mysql.user WHERE User='$MYSQL_USER';
SHOW GRANTS FOR '$MYSQL_USER'@'%';
EOF

echo "MySQL 用户权限修复完成"