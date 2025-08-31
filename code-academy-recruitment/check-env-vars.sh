#!/bin/bash

# 检查和修复环境变量配置

echo "🔍 检查环境变量配置"
echo "=================="

if [ ! -f .env ]; then
    echo "❌ .env 文件不存在"
    echo "请运行: cp .env.example .env"
    exit 1
fi

echo "📋 当前 .env 文件中的数据库配置:"
grep -E "DB_USER|DB_PASSWORD|DB_ROOT_PASSWORD|NODE_ENV" .env || echo "未找到相关配置"

echo ""
echo "🔧 检查配置问题..."

# 检查 DB_USER
if grep -q "DB_USER=recruitment_user" .env; then
    echo "❌ 发现问题: DB_USER=recruitment_user"
    echo "需要修改为: DB_USER=root"
    echo ""
    read -p "是否自动修复? (y/N): " fix_user
    if [[ $fix_user == "y" || $fix_user == "Y" ]]; then
        sed -i 's/DB_USER=recruitment_user/DB_USER=root/' .env
        echo "✅ 已修复 DB_USER"
    fi
fi

# 检查密码一致性
DB_PASSWORD=$(grep "^DB_PASSWORD=" .env | cut -d'=' -f2)
DB_ROOT_PASSWORD=$(grep "^DB_ROOT_PASSWORD=" .env | cut -d'=' -f2)

if [ "$DB_PASSWORD" != "$DB_ROOT_PASSWORD" ]; then
    echo "❌ 发现问题: DB_PASSWORD 和 DB_ROOT_PASSWORD 不一致"
    echo "DB_PASSWORD=$DB_PASSWORD"
    echo "DB_ROOT_PASSWORD=$DB_ROOT_PASSWORD"
    echo ""
    read -p "是否统一为 root_password? (y/N): " fix_password
    if [[ $fix_password == "y" || $fix_password == "Y" ]]; then
        sed -i 's/^DB_PASSWORD=.*/DB_PASSWORD=root_password/' .env
        sed -i 's/^DB_ROOT_PASSWORD=.*/DB_ROOT_PASSWORD=root_password/' .env
        echo "✅ 已统一密码配置"
    fi
fi

# 检查 NODE_ENV
if grep -q "NODE_ENV=production" .env; then
    echo "ℹ️  当前是生产模式，建议改为开发模式以获得更多日志"
    read -p "是否改为开发模式? (y/N): " fix_env
    if [[ $fix_env == "y" || $fix_env == "Y" ]]; then
        sed -i 's/NODE_ENV=production/NODE_ENV=development/' .env
        echo "✅ 已改为开发模式"
    fi
fi

echo ""
echo "📋 修复后的配置:"
grep -E "DB_USER|DB_PASSWORD|DB_ROOT_PASSWORD|NODE_ENV" .env

echo ""
echo "✅ 环境变量检查完成"
echo ""
echo "🚀 现在可以重新部署:"
echo "./deploy.sh clean"