#!/bin/bash

# 代码书院实验室纳新系统 - 服务器快速部署脚本
# 适用于 Ubuntu/Debian/CentOS 服务器

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

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

# 检测操作系统
detect_os() {
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        OS=$NAME
        VERSION=$VERSION_ID
    else
        print_error "无法检测操作系统"
        exit 1
    fi
    
    print_message "检测到操作系统: $OS $VERSION"
}

# 检测架构
detect_arch() {
    ARCH=$(uname -m)
    print_message "检测到架构: $ARCH"
    
    case $ARCH in
        x86_64)
            DOCKER_PLATFORM="linux/amd64"
            ;;
        aarch64|arm64)
            DOCKER_PLATFORM="linux/arm64"
            ;;
        armv7l)
            DOCKER_PLATFORM="linux/arm/v7"
            ;;
        *)
            print_warning "未知架构: $ARCH"
            DOCKER_PLATFORM="linux/amd64"
            ;;
    esac
}

# 安装 Docker
install_docker() {
    if command -v docker &> /dev/null && docker compose version &> /dev/null; then
        print_message "Docker 和 Docker Compose V2 已安装"
        return
    fi
    
    print_step "安装 Docker..."
    
    case $OS in
        *Ubuntu*|*Debian*)
            # Ubuntu/Debian 安装
            sudo apt update
            sudo apt install -y apt-transport-https ca-certificates curl gnupg lsb-release
            
            curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
            
            echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
            
            sudo apt update
            sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
            ;;
        *CentOS*|*Red\ Hat*)
            # CentOS/RHEL 安装
            sudo yum install -y yum-utils
            sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
            sudo yum install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
            ;;
        *)
            print_error "不支持的操作系统: $OS"
            exit 1
            ;;
    esac
    
    # 启动 Docker
    sudo systemctl start docker
    sudo systemctl enable docker
    
    # 添加用户到 docker 组
    sudo usermod -aG docker $USER
    
    print_message "Docker 和 Docker Compose V2 安装完成"
    print_warning "请重新登录以应用 docker 组权限"
    
    # 验证安装
    if docker compose version &> /dev/null; then
        print_message "Docker Compose V2 验证成功 ✓"
    else
        print_error "Docker Compose V2 安装失败"
        exit 1
    fi
}

# 配置防火墙
configure_firewall() {
    print_step "配置防火墙..."
    
    if command -v ufw &> /dev/null; then
        # Ubuntu/Debian UFW
        sudo ufw allow 43000/tcp
        sudo ufw allow 45000/tcp
        sudo ufw allow 22/tcp
        print_message "UFW 防火墙配置完成"
    elif command -v firewall-cmd &> /dev/null; then
        # CentOS/RHEL firewalld
        sudo firewall-cmd --permanent --add-port=43000/tcp
        sudo firewall-cmd --permanent --add-port=45000/tcp
        sudo firewall-cmd --reload
        print_message "Firewalld 防火墙配置完成"
    else
        print_warning "未检测到防火墙，请手动开放端口 43000 和 45000"
    fi
}

# 创建项目目录
setup_project() {
    print_step "设置项目目录..."
    
    PROJECT_DIR="/opt/code-academy-recruitment"
    
    if [ ! -d "$PROJECT_DIR" ]; then
        sudo mkdir -p "$PROJECT_DIR"
        sudo chown $USER:$USER "$PROJECT_DIR"
    fi
    
    cd "$PROJECT_DIR"
    print_message "项目目录: $PROJECT_DIR"
}

# 环境配置向导
configure_environment() {
    print_step "环境配置向导..."
    
    if [ ! -f .env ]; then
        cp .env.example .env
        print_message "已创建 .env 配置文件"
    fi
    
    echo ""
    print_warning "请配置以下重要参数："
    echo "1. 数据库密码 (DB_PASSWORD)"
    echo "2. Redis 密码 (REDIS_PASSWORD)"
    echo "3. JWT 密钥 (JWT_SECRET)"
    echo "4. 邮箱配置 (EMAIL_*)"
    echo "5. 允许的邮箱域名 (ALLOWED_EMAIL_DOMAIN)"
    echo ""
    
    read -p "是否现在编辑配置文件? (y/n): " edit_config
    if [[ $edit_config == "y" || $edit_config == "Y" ]]; then
        ${EDITOR:-nano} .env
    else
        print_warning "请稍后手动编辑 .env 文件"
    fi
}

# 部署服务
deploy_services() {
    print_step "部署服务..."
    
    # 检查配置文件
    if [ ! -f .env ]; then
        print_error ".env 文件不存在，请先配置环境变量"
        exit 1
    fi
    
    # 执行部署
    chmod +x deploy.sh
    ./deploy.sh
}

# 显示部署结果
show_deployment_info() {
    print_message "部署完成！"
    echo ""
    echo "========================================="
    echo "🌐 访问地址："
    echo "前端界面: http://$(curl -s ifconfig.me):43000"
    echo "后端 API: http://$(curl -s ifconfig.me):45000"
    echo ""
    echo "🔧 本地访问："
    echo "前端: http://localhost:43000"
    echo "后端: http://localhost:45000"
    echo "MySQL: localhost:43306"
    echo "Redis: localhost:46379"
    echo ""
    echo "👤 默认管理员："
    echo "邮箱: 查看 .env 文件中的 ADMIN_EMAIL"
    echo "密码: 查看 .env 文件中的 ADMIN_PASSWORD"
    echo "========================================="
    echo ""
    echo "📋 常用命令："
    echo "查看状态: make health"
    echo "查看日志: make logs"
    echo "重启服务: make restart"
    echo "备份数据: make backup"
    echo "停止服务: make down"
}

# 主函数
main() {
    print_message "代码书院实验室纳新系统 - 服务器部署开始"
    echo ""
    
    detect_os
    detect_arch
    
    # 检查是否为 root 用户
    if [ "$EUID" -eq 0 ]; then
        print_error "请不要使用 root 用户运行此脚本"
        print_message "请使用普通用户，脚本会在需要时请求 sudo 权限"
        exit 1
    fi
    
    # 安装依赖
    install_docker
    configure_firewall
    
    # 项目设置
    setup_project
    
    # 如果项目文件不存在，提示用户
    if [ ! -f "docker-compose.yml" ]; then
        print_error "项目文件不存在！"
        echo ""
        echo "请先获取项目代码："
        echo "git clone <repository-url> ."
        echo "或者将项目文件上传到当前目录"
        exit 1
    fi
    
    configure_environment
    deploy_services
    show_deployment_info
    
    print_message "部署流程完成！"
}

# 检查参数
if [[ "$1" == "--help" || "$1" == "-h" ]]; then
    echo "代码书院实验室纳新系统 - 服务器部署脚本"
    echo ""
    echo "使用方法:"
    echo "  $0                 # 交互式部署"
    echo "  $0 --help         # 显示帮助"
    echo ""
    echo "部署步骤:"
    echo "1. 检测系统环境"
    echo "2. 安装 Docker"
    echo "3. 配置防火墙"
    echo "4. 设置项目目录"
    echo "5. 配置环境变量"
    echo "6. 部署服务"
    exit 0
fi

# 执行主函数
main