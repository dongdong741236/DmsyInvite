#!/bin/bash

# MySQL 配置文件架构适配脚本

set -e

# 检测架构
ARCH=$(uname -m)
CONFIG_SOURCE=""

case $ARCH in
    x86_64)
        echo "检测到 x86_64 架构，使用标准配置"
        CONFIG_SOURCE="my.cnf"
        ;;
    aarch64|arm64)
        echo "检测到 ARM64 架构，使用 ARM 优化配置"
        CONFIG_SOURCE="my-arm.cnf"
        ;;
    armv7l)
        echo "检测到 ARMv7 架构，使用 ARM 优化配置"
        CONFIG_SOURCE="my-arm.cnf"
        ;;
    *)
        echo "未知架构: $ARCH，使用默认配置"
        CONFIG_SOURCE="my.cnf"
        ;;
esac

# 复制配置文件
if [ -f "/docker-entrypoint-initdb.d/$CONFIG_SOURCE" ]; then
    cp "/docker-entrypoint-initdb.d/$CONFIG_SOURCE" /etc/mysql/conf.d/custom.cnf
    echo "MySQL 配置文件已设置: $CONFIG_SOURCE"
else
    echo "警告: 配置文件 $CONFIG_SOURCE 不存在，使用默认配置"
fi

# 显示最终配置信息
echo "MySQL 配置信息："
echo "- 架构: $ARCH"
echo "- 配置文件: $CONFIG_SOURCE"
echo "- InnoDB 缓冲池: $(grep innodb_buffer_pool_size /etc/mysql/conf.d/custom.cnf 2>/dev/null || echo '默认')"