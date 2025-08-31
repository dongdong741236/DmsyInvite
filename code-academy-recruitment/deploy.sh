#!/bin/bash

# 代码书院实验室纳新系统 - 统一部署和更新脚本
# 支持首次部署、代码更新、服务重启等功能

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

# 显示帮助信息
show_help() {
    echo "代码书院实验室纳新系统 - 部署脚本"
    echo ""
    echo "用法:"
    echo "  $0 [选项]"
    echo ""
    echo "选项:"
    echo "  install     首次安装部署"
    echo "  update      更新代码并重新部署"
    echo "  restart     重启所有服务"
    echo "  stop        停止所有服务"
    echo "  status      查看服务状态"
    echo "  logs        查看服务日志"
    echo "  clean       清理并重新部署"
    echo "  help        显示此帮助信息"
    echo ""
    echo "示例:"
    echo "  $0 install    # 首次部署"
    echo "  $0 update     # 更新代码"
    echo "  $0 restart    # 重启服务"
}

# 检测架构和选择配置文件
detect_platform() {
    ARCH=$(uname -m)
    COMPOSE_FILE="docker-compose.yml"
    
    case $ARCH in
        aarch64|arm64)
            print_message "检测到 ARM64 架构"
            if [ -f "docker-compose.arm.yml" ]; then
                COMPOSE_FILE="docker-compose.arm.yml"
                print_message "使用 ARM 优化配置"
            fi
            ;;
        x86_64)
            print_message "检测到 x86_64 架构"
            ;;
        *)
            print_warning "未知架构: $ARCH，使用默认配置"
            ;;
    esac
}

# 检查依赖
check_dependencies() {
    print_step "检查系统依赖..."
    
    if ! command -v docker &> /dev/null; then
        print_error "Docker 未安装，请先安装 Docker"
        echo "安装命令: sudo apt install docker.io docker-compose-plugin"
        exit 1
    fi
    
    if ! docker compose version &> /dev/null; then
        print_error "Docker Compose V2 未安装"
        echo "安装命令: sudo apt install docker-compose-plugin"
        exit 1
    fi
    
    print_message "依赖检查通过 ✓"
}

# 创建或检查配置文件
setup_config() {
    if [ ! -f .env ]; then
        print_step "创建配置文件..."
        cp .env.example .env
        print_warning "请编辑 .env 文件，配置必要的参数："
        echo "  - DB_PASSWORD (数据库密码)"
        echo "  - REDIS_PASSWORD (Redis密码)"
        echo "  - JWT_SECRET (JWT密钥)"
        echo "  - EMAIL_* (邮箱配置)"
        echo "  - ALLOWED_EMAIL_DOMAIN (邮箱域名)"
        echo ""
        read -p "配置完成后按回车继续..."
    else
        print_message "配置文件已存在 ✓"
    fi
}

# 首次安装
install() {
    print_step "首次安装部署"
    
    check_dependencies
    detect_platform
    setup_config
    
    print_message "开始构建和部署服务..."
    
    # 构建镜像
    print_message "构建 Docker 镜像..."
    docker compose -f $COMPOSE_FILE build
    
    # 启动服务
    print_message "启动服务..."
    docker compose -f $COMPOSE_FILE up -d
    
    # 等待服务启动
    print_message "等待服务启动..."
    sleep 30
    
    check_health
    show_access_info
}

# 更新代码并重新部署
update() {
    print_step "更新代码并重新部署"
    
    detect_platform
    
    # 拉取最新代码
    if [ -d .git ]; then
        print_message "拉取最新代码..."
        git pull
    else
        print_warning "不是 Git 仓库，跳过代码拉取"
    fi
    
    # 重新构建镜像
    print_message "重新构建镜像..."
    docker compose -f $COMPOSE_FILE build --no-cache
    
    # 重启服务
    print_message "重启服务..."
    docker compose -f $COMPOSE_FILE up -d
    
    print_message "等待服务启动..."
    sleep 20
    
    check_health
    print_message "更新完成 ✓"
}

# 重启服务
restart() {
    print_step "重启所有服务"
    
    detect_platform
    docker compose -f $COMPOSE_FILE restart
    
    print_message "等待服务启动..."
    sleep 15
    
    check_health
}

# 停止服务
stop() {
    print_step "停止所有服务"
    
    detect_platform
    docker compose -f $COMPOSE_FILE down
    
    print_message "所有服务已停止"
}

# 查看服务状态
status() {
    print_step "查看服务状态"
    
    detect_platform
    
    echo "容器状态:"
    docker compose -f $COMPOSE_FILE ps
    
    echo ""
    echo "网络信息:"
    if docker network inspect code-academy-recruitment_recruitment-network >/dev/null 2>&1; then
        docker network inspect code-academy-recruitment_recruitment-network --format '{{range .Containers}}{{.Name}}: {{.IPv4Address}}{{"\n"}}{{end}}'
    else
        echo "项目网络不存在"
    fi
}

# 查看日志
logs() {
    print_step "查看服务日志"
    
    detect_platform
    
    if [ -n "$2" ]; then
        # 查看特定服务日志
        docker compose -f $COMPOSE_FILE logs -f $2
    else
        # 查看所有服务日志
        docker compose -f $COMPOSE_FILE logs -f
    fi
}

# 清理并重新部署
clean() {
    print_step "清理并重新部署"
    
    detect_platform
    
    print_warning "这将删除所有容器、镜像和数据卷，重新初始化数据库"
    read -p "确认继续? (y/N): " confirm
    
    if [[ $confirm != "y" && $confirm != "Y" ]]; then
        echo "操作已取消"
        exit 0
    fi
    
    # 停止服务并删除数据卷（重新初始化数据库权限）
    docker compose -f $COMPOSE_FILE down -v
    
    # 删除镜像
    docker image rm code-academy-recruitment-backend code-academy-recruitment-frontend 2>/dev/null || true
    
    # 清理缓存
    docker system prune -f
    
    # 重新构建和启动
    print_message "重新构建和启动..."
    docker compose -f $COMPOSE_FILE build --no-cache
    docker compose -f $COMPOSE_FILE up -d
    
    print_message "等待服务启动..."
    sleep 30
    
    check_health
}

# 健康检查
check_health() {
    print_step "健康检查"
    
    # 检查容器状态
    echo "容器状态:"
    docker compose -f $COMPOSE_FILE ps
    
    # 检查后端
    echo ""
    echo "后端服务检查:"
    if curl -f http://localhost:45000/health > /dev/null 2>&1; then
        print_message "后端服务正常 ✓"
    else
        print_warning "后端服务异常"
        echo "后端容器状态:"
        docker ps -a --filter "name=recruitment-backend" --format "table {{.Names}}\t{{.Status}}"
        echo "后端日志（最后10行）:"
        docker logs recruitment-backend --tail=10 2>/dev/null || echo "无法获取日志"
    fi
    
    # 检查前端
    echo ""
    echo "前端服务检查:"
    if curl -f http://localhost:43000/health > /dev/null 2>&1; then
        print_message "前端服务正常 ✓"
    else
        print_warning "前端服务异常"
        echo "前端日志（最后5行）:"
        docker logs recruitment-frontend --tail=5 2>/dev/null || echo "无法获取日志"
    fi
    
    # 检查前端代理
    echo ""
    echo "API 代理检查:"
    if curl -f http://localhost:43000/api/health > /dev/null 2>&1; then
        print_message "前端 API 代理正常 ✓"
    else
        print_warning "前端 API 代理异常"
    fi
}

# 显示访问信息
show_access_info() {
    print_message "部署完成！"
    echo ""
    echo "========================================="
    echo "🌐 访问地址："
    echo "前端界面: http://localhost:43000"
    echo "后端 API: http://localhost:45000"
    echo ""
    echo "👤 默认管理员："
    echo "邮箱: 查看 .env 文件中的 ADMIN_EMAIL"
    echo "密码: 查看 .env 文件中的 ADMIN_PASSWORD"
    echo ""
    echo "📧 邮箱验证码注册："
    echo "新用户注册需要先验证邮箱验证码"
    echo "请确保 .env 中配置了邮箱服务器信息"
    echo "========================================="
    echo ""
    echo "📋 常用命令："
    echo "./deploy.sh status    # 查看服务状态"
    echo "./deploy.sh logs      # 查看日志"
    echo "./deploy.sh restart   # 重启服务"
    echo "./deploy.sh update    # 更新代码"
    echo "./deploy.sh clean     # 清理重建"
}

# 主函数
main() {
    case "${1:-install}" in
        install)
            install
            ;;
        update)
            update
            ;;
        restart)
            restart
            ;;
        stop)
            stop
            ;;
        status)
            status
            ;;
        logs)
            logs "$@"
            ;;
        clean)
            clean
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            print_error "未知选项: $1"
            echo ""
            show_help
            exit 1
            ;;
    esac
}

# 执行主函数
main "$@"