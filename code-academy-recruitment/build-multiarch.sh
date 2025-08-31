#!/bin/bash

# 多架构镜像构建脚本
# 支持 x86_64 和 ARM64 架构

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_message() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# 检测当前架构
detect_architecture() {
    ARCH=$(uname -m)
    case $ARCH in
        x86_64)
            DOCKER_ARCH="linux/amd64"
            print_message "检测到 x86_64 架构"
            ;;
        aarch64|arm64)
            DOCKER_ARCH="linux/arm64"
            print_message "检测到 ARM64 架构"
            ;;
        armv7l)
            DOCKER_ARCH="linux/arm/v7"
            print_message "检测到 ARMv7 架构"
            ;;
        *)
            print_warning "未知架构: $ARCH，使用默认配置"
            DOCKER_ARCH="linux/amd64"
            ;;
    esac
}

# 检查 Docker Buildx
check_buildx() {
    print_step "检查 Docker Buildx 支持..."
    
    if ! docker buildx version > /dev/null 2>&1; then
        print_error "Docker Buildx 未安装或不可用"
        print_message "请更新到 Docker 19.03+ 或安装 buildx 插件"
        exit 1
    fi
    
    # 创建多架构构建器（如果不存在）
    if ! docker buildx inspect multiarch-builder > /dev/null 2>&1; then
        print_message "创建多架构构建器..."
        docker buildx create --name multiarch-builder --use
        docker buildx inspect --bootstrap
    else
        print_message "使用现有的多架构构建器"
        docker buildx use multiarch-builder
    fi
}

# 构建多架构镜像
build_multiarch() {
    print_step "开始构建多架构镜像..."
    
    # 设置镜像标签
    BACKEND_IMAGE="recruitment-backend:latest"
    FRONTEND_IMAGE="recruitment-frontend:latest"
    
    # 构建后端镜像
    print_message "构建后端镜像 (支持 amd64, arm64)..."
    docker buildx build \
        --platform linux/amd64,linux/arm64 \
        --tag $BACKEND_IMAGE \
        --load \
        ./backend
    
    # 构建前端镜像
    print_message "构建前端镜像 (支持 amd64, arm64)..."
    docker buildx build \
        --platform linux/amd64,linux/arm64 \
        --tag $FRONTEND_IMAGE \
        --load \
        --build-arg REACT_APP_API_URL=${REACT_APP_API_URL:-http://localhost:5000/api} \
        --build-arg REACT_APP_ALLOWED_EMAIL_DOMAIN=${ALLOWED_EMAIL_DOMAIN:-@stu.example.edu.cn} \
        ./frontend
    
    print_message "多架构镜像构建完成！"
}

# 单架构构建（更快）
build_single_arch() {
    print_step "构建当前架构镜像 ($DOCKER_ARCH)..."
    
    # 构建后端
    print_message "构建后端镜像..."
    docker build --platform $DOCKER_ARCH -t recruitment-backend:latest ./backend
    
    # 构建前端
    print_message "构建前端镜像..."
    docker build --platform $DOCKER_ARCH \
        --build-arg REACT_APP_API_URL=${REACT_APP_API_URL:-http://localhost:5000/api} \
        --build-arg REACT_APP_ALLOWED_EMAIL_DOMAIN=${ALLOWED_EMAIL_DOMAIN:-@stu.example.edu.cn} \
        -t recruitment-frontend:latest ./frontend
    
    print_message "单架构镜像构建完成！"
}

# 启动服务
start_services() {
    print_step "启动服务..."
    
    # 停止旧容器
    docker-compose down
    
    # 启动新服务
    docker-compose up -d
    
    print_message "服务启动完成！"
    
    # 等待服务就绪
    print_message "等待服务启动..."
    sleep 15
    
    # 检查服务状态
    print_step "检查服务状态..."
    docker-compose ps
}

# 显示架构信息
show_platform_info() {
    print_step "平台信息："
    echo "系统架构: $(uname -m)"
    echo "Docker 架构: $DOCKER_ARCH"
    echo "MySQL 镜像: mysql:8.0 (官方多架构支持)"
    echo "Redis 镜像: redis:7-alpine (官方多架构支持)"
    echo "Node.js 镜像: node:18-alpine (官方多架构支持)"
    echo "Nginx 镜像: nginx:alpine (官方多架构支持)"
}

# 主函数
main() {
    print_message "代码书院多架构镜像构建开始"
    
    # 加载环境变量
    if [ -f .env ]; then
        export $(cat .env | grep -v '#' | xargs)
    fi
    
    detect_architecture
    show_platform_info
    
    # 询问构建方式
    echo ""
    echo "请选择构建方式："
    echo "1) 单架构构建（当前架构，更快）"
    echo "2) 多架构构建（支持 amd64 + arm64，较慢）"
    echo "3) 仅启动服务（使用现有镜像）"
    read -p "请输入选择 (1-3): " choice
    
    case $choice in
        1)
            build_single_arch
            start_services
            ;;
        2)
            check_buildx
            build_multiarch
            start_services
            ;;
        3)
            start_services
            ;;
        *)
            print_error "无效选择"
            exit 1
            ;;
    esac
    
    print_message "构建完成！"
    echo ""
    echo "访问地址："
    echo "前端: http://localhost:3000"
    echo "后端: http://localhost:5000"
    echo "MySQL: localhost:3306"
}

main "$@"