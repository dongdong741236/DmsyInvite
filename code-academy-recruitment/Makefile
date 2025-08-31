.PHONY: help build up down restart logs clean backup restore dev prod arm x86

# 检测架构
ARCH := $(shell uname -m)
COMPOSE_FILE := docker-compose.yml

ifeq ($(ARCH),aarch64)
    COMPOSE_FILE := docker-compose.arm.yml
endif
ifeq ($(ARCH),arm64)
    COMPOSE_FILE := docker-compose.arm.yml
endif
ifeq ($(ARCH),armv7l)
    COMPOSE_FILE := docker-compose.arm.yml
endif

# 默认目标
help:
	@echo "代码书院实验室纳新系统 - 可用命令："
	@echo ""
	@echo "  make build      - 构建所有Docker镜像"
	@echo "  make up         - 启动所有服务"
	@echo "  make down       - 停止所有服务"
	@echo "  make restart    - 重启所有服务"
	@echo "  make logs       - 查看所有服务日志"
	@echo "  make clean      - 清理容器和镜像"
	@echo "  make backup     - 备份数据库"
	@echo "  make restore    - 恢复数据库"
	@echo "  make dev        - 开发模式启动"
	@echo "  make prod       - 生产模式部署"
	@echo "  make arm        - 强制使用ARM配置"
	@echo "  make x86        - 强制使用x86配置"
	@echo ""
	@echo "当前架构: $(ARCH)"
	@echo "使用配置: $(COMPOSE_FILE)"

# 构建镜像
build:
	docker-compose -f $(COMPOSE_FILE) build

# 启动服务
up:
	docker-compose -f $(COMPOSE_FILE) up -d
	@echo "服务已启动!"
	@echo "前端: http://localhost:43000"
	@echo "后端: http://localhost:45000"
	@echo "MySQL: localhost:43306"
	@echo "架构: $(ARCH)"

# 停止服务
down:
	docker-compose -f $(COMPOSE_FILE) down

# 重启服务
restart:
	docker-compose -f $(COMPOSE_FILE) restart

# 查看日志
logs:
	docker-compose -f $(COMPOSE_FILE) logs -f

# 清理
clean:
	docker-compose -f $(COMPOSE_FILE) down -v
	docker system prune -f

# 强制使用ARM配置
arm:
	docker-compose -f docker-compose.arm.yml up -d
	@echo "强制使用ARM配置启动"

# 强制使用x86配置  
x86:
	docker-compose -f docker-compose.yml up -d
	@echo "强制使用x86配置启动"

# 备份数据库
backup:
	@mkdir -p backups
	@docker exec recruitment-mysql mysqldump -u recruitment_user -p$$MYSQL_PASSWORD recruitment_db > backups/backup_$$(date +%Y%m%d_%H%M%S).sql
	@echo "数据库备份完成: backups/backup_$$(date +%Y%m%d_%H%M%S).sql"

# 恢复数据库
restore:
	@read -p "输入备份文件路径: " backup_file; \
	docker exec -i recruitment-mysql mysql -u recruitment_user -p$$MYSQL_PASSWORD recruitment_db < $$backup_file

# 开发模式
dev:
	@echo "启动开发环境..."
	cd backend && npm run dev &
	cd frontend && npm start &
	@echo "开发服务器已启动"

# 生产部署
prod:
	./deploy.sh

# 检查服务健康状态
health:
	@echo "检查服务健康状态..."
	@curl -s http://localhost:45000/health > /dev/null && echo "✓ 后端服务正常" || echo "✗ 后端服务异常"
	@curl -s http://localhost:43000/health > /dev/null && echo "✓ 前端服务正常" || echo "✗ 前端服务异常"