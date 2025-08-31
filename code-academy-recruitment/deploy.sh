#!/bin/bash

# 代码书院实验室纳新系统部署脚本
# 支持 ARM 和 x86 架构

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 打印带颜色的消息
print_message() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# 检查依赖
check_dependencies() {
    print_message "检查系统依赖..."
    
    if ! command -v docker &> /dev/null; then
        print_error "Docker 未安装，请先安装 Docker"
        exit 1
    fi
    
    if ! docker compose version &> /dev/null; then
        print_error "Docker Compose V2 未安装，请先安装 Docker Compose V2"
        print_message "安装方法: sudo apt install docker-compose-plugin"
        exit 1
    fi
    
    print_message "依赖检查通过 ✓"
}

# 检查架构
check_architecture() {
    ARCH=$(uname -m)
    print_message "检测到系统架构: $ARCH"
    
    case $ARCH in
        x86_64)
            print_message "x86_64 架构确认 ✓"
            PLATFORM_CONFIG="标准配置"
            ;;
        aarch64|arm64)
            print_message "ARM64 架构确认 ✓"
            PLATFORM_CONFIG="ARM 优化配置"
            print_message "将使用 ARM 优化的 MySQL 配置"
            ;;
        armv7l)
            print_message "ARMv7 架构确认 ✓"
            PLATFORM_CONFIG="ARM 优化配置"
            print_message "将使用 ARM 优化的 MySQL 配置"
            ;;
        *)
            print_warning "未知架构: $ARCH，使用默认配置"
            PLATFORM_CONFIG="默认配置"
            ;;
    esac
    
    print_message "平台配置: $PLATFORM_CONFIG"
}

# 创建环境文件
create_env_file() {
    if [ ! -f .env ]; then
        print_message "创建环境配置文件..."
        cp .env.example .env
        print_warning "请编辑 .env 文件，配置必要的参数（数据库密码、邮箱设置等）"
        print_warning "配置完成后请重新运行此脚本"
        exit 0
    else
        print_message "环境配置文件已存在 ✓"
    fi
}

# 构建和启动服务
deploy_services() {
    print_message "开始构建和部署服务..."
    
    # 选择合适的 docker-compose 文件
    COMPOSE_FILE="docker-compose.yml"
    if [[ "$ARCH" == "aarch64" ]] || [[ "$ARCH" == "arm64" ]] || [[ "$ARCH" == "armv7l" ]]; then
        print_message "使用 ARM 优化的 Docker Compose 配置"
        COMPOSE_FILE="docker-compose.arm.yml"
    fi
    
    # 停止旧容器（如果存在）
    docker compose -f $COMPOSE_FILE down
    
    # 构建镜像
    print_message "构建 Docker 镜像..."
    docker compose -f $COMPOSE_FILE build --no-cache
    
    # 启动服务
    print_message "启动服务..."
    docker compose -f $COMPOSE_FILE up -d
    
    # 等待服务启动（ARM 设备启动较慢）
    if [[ "$ARCH" == "aarch64" ]] || [[ "$ARCH" == "arm64" ]] || [[ "$ARCH" == "armv7l" ]]; then
        print_message "ARM 设备启动中，请稍候..."
        sleep 30
    else
        print_message "等待服务启动..."
        sleep 15
    fi
    
    # 检查服务状态
    print_message "检查服务状态..."
    docker compose -f $COMPOSE_FILE ps
}

# 健康检查
health_check() {
    print_message "执行健康检查..."
    
    # 检查MySQL
    if docker exec recruitment-mysql mysqladmin ping -h localhost -u recruitment_user -p$DB_PASSWORD --silent > /dev/null 2>&1; then
        print_message "MySQL 数据库健康 ✓"
    else
        print_error "MySQL 数据库不可用"
    fi
    
    # 检查后端
    if curl -f http://localhost:45000/health > /dev/null 2>&1; then
        print_message "后端服务健康 ✓"
    else
        print_error "后端服务不可用"
    fi
    
    # 检查前端
    if curl -f http://localhost:43000/health > /dev/null 2>&1; then
        print_message "前端服务健康 ✓"
    else
        print_error "前端服务不可用"
    fi
}

# 显示访问信息
show_access_info() {
    print_message "部署完成！"
    echo ""
    echo "========================================="
    echo "访问地址："
    echo "前端界面: http://localhost:43000"
    echo "后端 API: http://localhost:45000"
    echo "MySQL 数据库: localhost:43306"
    echo "Redis 缓存: localhost:46379"
    echo ""
    echo "默认管理员账号："
    echo "邮箱: admin@codeacademy.edu.cn"
    echo "密码: 请查看 .env 文件中的 ADMIN_PASSWORD"
    echo "========================================="
    echo ""
    echo "常用命令："
    echo "查看日志: docker compose logs -f [service_name]"
    echo "停止服务: docker compose down"
    echo "重启服务: docker compose restart"
    echo "查看状态: docker compose ps"
}

# 主函数
main() {
    print_message "代码书院实验室纳新系统部署开始"
    
    check_dependencies
    check_architecture
    create_env_file
    deploy_services
    health_check
    show_access_info
    
    print_message "部署流程完成！"
}

# 执行主函数
main