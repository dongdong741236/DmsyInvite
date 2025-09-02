#!/bin/bash

# 重建和启动应用的脚本

echo "=== 代码书院招新系统 - 重建和启动 ==="
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查Docker是否安装
if ! command -v docker &> /dev/null; then
    echo -e "${RED}错误: Docker未安装${NC}"
    echo "请先安装Docker: https://docs.docker.com/get-docker/"
    exit 1
fi

# 检查docker-compose或docker compose
if command -v docker-compose &> /dev/null; then
    COMPOSE_CMD="docker-compose"
elif docker compose version &> /dev/null 2>&1; then
    COMPOSE_CMD="docker compose"
else
    echo -e "${RED}错误: Docker Compose未安装${NC}"
    echo "请先安装Docker Compose: https://docs.docker.com/compose/install/"
    exit 1
fi

echo -e "${GREEN}使用命令: $COMPOSE_CMD${NC}"
echo ""

# 停止现有容器
echo "停止现有容器..."
$COMPOSE_CMD down

# 清理旧的镜像（可选）
read -p "是否清理旧的镜像？(y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "清理旧镜像..."
    docker image prune -f
fi

# 重新构建并启动
echo ""
echo "重新构建并启动容器..."
$COMPOSE_CMD up -d --build

# 检查状态
echo ""
echo "检查容器状态..."
$COMPOSE_CMD ps

# 显示日志（最后20行）
echo ""
echo "最新日志："
$COMPOSE_CMD logs --tail=20

echo ""
echo -e "${GREEN}=== 构建完成 ===${NC}"
echo ""
echo "访问地址："
echo "- 前端: http://localhost:3000"
echo "- 后端API: http://localhost:3001/api"
echo "- phpMyAdmin: http://localhost:8080"
echo ""
echo "查看日志: $COMPOSE_CMD logs -f"
echo "停止服务: $COMPOSE_CMD down"
echo ""
echo -e "${YELLOW}修复说明：${NC}"
echo "1. 修复了面试结果隐私保护问题"
echo "2. 修复了面试官页面错误处理"
echo "3. 用户现在无法在通知发送前看到面试结果"