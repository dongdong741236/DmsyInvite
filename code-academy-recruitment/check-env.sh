#!/bin/bash

# 环境检查脚本 - 验证部署环境是否就绪

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_check() {
    echo -n "检查 $1... "
}

print_ok() {
    echo -e "${GREEN}✓${NC}"
}

print_fail() {
    echo -e "${RED}✗${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC}"
}

echo "🔍 代码书院纳新系统 - 环境检查"
echo "=================================="

# 检查操作系统
print_check "操作系统"
if [ -f /etc/os-release ]; then
    . /etc/os-release
    echo -e "${GREEN}✓${NC} $NAME $VERSION_ID"
else
    print_fail
    echo "   无法检测操作系统"
fi

# 检查架构
print_check "系统架构"
ARCH=$(uname -m)
case $ARCH in
    x86_64)
        echo -e "${GREEN}✓${NC} x86_64 (Intel/AMD)"
        ;;
    aarch64|arm64)
        echo -e "${GREEN}✓${NC} ARM64 (支持)"
        ;;
    armv7l)
        echo -e "${YELLOW}⚠${NC} ARMv7 (基本支持)"
        ;;
    *)
        echo -e "${RED}✗${NC} 未知架构: $ARCH"
        ;;
esac

# 检查 Docker
print_check "Docker"
if command -v docker &> /dev/null; then
    DOCKER_VERSION=$(docker --version | cut -d' ' -f3 | cut -d',' -f1)
    echo -e "${GREEN}✓${NC} $DOCKER_VERSION"
else
    print_fail
    echo "   Docker 未安装"
    DOCKER_MISSING=true
fi

# 检查 Docker Compose V2
print_check "Docker Compose V2"
if docker compose version &> /dev/null 2>&1; then
    COMPOSE_VERSION=$(docker compose version --short)
    echo -e "${GREEN}✓${NC} $COMPOSE_VERSION"
else
    print_fail
    echo "   Docker Compose V2 未安装"
    COMPOSE_MISSING=true
fi

# 检查 Docker 服务状态
print_check "Docker 服务"
if systemctl is-active --quiet docker 2>/dev/null; then
    print_ok
else
    print_fail
    echo "   Docker 服务未运行"
fi

# 检查用户权限
print_check "Docker 用户权限"
if groups $USER | grep -q docker; then
    print_ok
else
    print_warning
    echo "   用户不在 docker 组中"
fi

# 检查端口可用性
echo ""
echo "🔌 端口可用性检查："

check_port() {
    local port=$1
    local service=$2
    print_check "$service (端口 $port)"
    
    if ss -tuln | grep -q ":$port "; then
        print_fail
        echo "   端口 $port 已被占用"
        ss -tuln | grep ":$port "
    else
        print_ok
    fi
}

check_port 43000 "前端"
check_port 45000 "后端"
check_port 43306 "MySQL"
check_port 46379 "Redis"

# 检查内存
echo ""
print_check "可用内存"
MEMORY_GB=$(free -g | awk '/^Mem:/{print $7}')
if [ "$MEMORY_GB" -ge 2 ]; then
    echo -e "${GREEN}✓${NC} ${MEMORY_GB}GB 可用"
else
    echo -e "${YELLOW}⚠${NC} ${MEMORY_GB}GB 可用（推荐 2GB+）"
fi

# 检查磁盘空间
print_check "磁盘空间"
DISK_GB=$(df -BG . | awk 'NR==2 {print $4}' | sed 's/G//')
if [ "$DISK_GB" -ge 10 ]; then
    echo -e "${GREEN}✓${NC} ${DISK_GB}GB 可用"
else
    echo -e "${YELLOW}⚠${NC} ${DISK_GB}GB 可用（推荐 20GB+）"
fi

# 检查网络连接
print_check "网络连接"
if ping -c 1 google.com &> /dev/null; then
    print_ok
else
    print_fail
    echo "   网络连接异常"
fi

# 检查项目文件
echo ""
echo "📁 项目文件检查："

check_file() {
    local file=$1
    print_check "$file"
    if [ -f "$file" ]; then
        print_ok
    else
        print_fail
    fi
}

check_file "docker-compose.yml"
check_file "docker-compose.arm.yml"
check_file ".env.example"
check_file "deploy.sh"
check_file "quick-deploy.sh"

# 总结
echo ""
echo "📋 检查总结："

if [ "${DOCKER_MISSING}" = true ] || [ "${COMPOSE_MISSING}" = true ]; then
    echo -e "${RED}❌ 环境未就绪${NC}"
    echo ""
    echo "🔧 解决方案："
    if [ "${DOCKER_MISSING}" = true ]; then
        echo "1. 安装 Docker: ./server-setup.sh"
    fi
    if [ "${COMPOSE_MISSING}" = true ]; then
        echo "2. 安装 Docker Compose V2: sudo apt install docker-compose-plugin"
    fi
    echo "3. 重新登录: su - $USER"
    echo "4. 重新检查: ./check-env.sh"
else
    echo -e "${GREEN}✅ 环境就绪，可以开始部署！${NC}"
    echo ""
    echo "🚀 部署命令："
    echo "快速部署: ./quick-deploy.sh"
    echo "完整部署: ./deploy.sh"
    echo "Make 部署: make prod"
fi

echo ""
echo "📖 更多信息:"
echo "Docker 安装: cat DOCKER_SETUP.md"
echo "部署指南: cat SERVER_DEPLOYMENT.md"
echo "命令参考: cat DOCKER_COMMANDS.md"