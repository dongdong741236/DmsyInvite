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
    
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose 未安装，请先安装 Docker Compose"
        exit 1
    fi
    
    print_message "依赖检查通过 ✓"
}

# 检查架构
check_architecture() {
    ARCH=$(uname -m)
    print_message "检测到系统架构: $ARCH"
    
    if [[ "$ARCH" == "arm64" ]] || [[ "$ARCH" == "aarch64" ]]; then
        print_message "ARM 架构确认 ✓"
    elif [[ "$ARCH" == "x86_64" ]]; then
        print_message "x86_64 架构确认 ✓"
    else
        print_warning "未知架构: $ARCH，可能会遇到兼容性问题"
    fi
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
    
    # 停止旧容器（如果存在）
    docker-compose down
    
    # 构建镜像
    print_message "构建 Docker 镜像..."
    docker-compose build --no-cache
    
    # 启动服务
    print_message "启动服务..."
    docker-compose up -d
    
    # 等待服务启动
    print_message "等待服务启动..."
    sleep 10
    
    # 检查服务状态
    print_message "检查服务状态..."
    docker-compose ps
}

# 健康检查
health_check() {
    print_message "执行健康检查..."
    
    # 检查后端
    if curl -f http://localhost:5000/health > /dev/null 2>&1; then
        print_message "后端服务健康 ✓"
    else
        print_error "后端服务不可用"
    fi
    
    # 检查前端
    if curl -f http://localhost:3000/health > /dev/null 2>&1; then
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
    echo "前端界面: http://localhost:3000"
    echo "后端 API: http://localhost:5000"
    echo ""
    echo "默认管理员账号："
    echo "邮箱: admin@codeacademy.edu.cn"
    echo "密码: 请查看 .env 文件中的 ADMIN_PASSWORD"
    echo "========================================="
    echo ""
    echo "常用命令："
    echo "查看日志: docker-compose logs -f [service_name]"
    echo "停止服务: docker-compose down"
    echo "重启服务: docker-compose restart"
    echo "查看状态: docker-compose ps"
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