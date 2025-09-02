#!/bin/bash

# MySQL健康检查脚本
# 用于Docker容器内的健康检查

set -e

# 检查MySQL服务是否运行
if ! mysqladmin ping -h localhost -u ${DB_USER:-recruitment_user} -p${DB_PASSWORD:-your_secure_password} --silent; then
    echo "MySQL服务不可用"
    exit 1
fi

# 检查数据库是否存在
if ! mysql -h localhost -u ${DB_USER:-recruitment_user} -p${DB_PASSWORD:-your_secure_password} -e "USE ${DB_NAME:-recruitment_db};" 2>/dev/null; then
    echo "数据库 ${DB_NAME:-recruitment_db} 不存在"
    exit 1
fi

echo "MySQL健康检查通过"
exit 0