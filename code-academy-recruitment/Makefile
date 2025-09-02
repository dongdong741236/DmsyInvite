.PHONY: help install update restart stop status logs clean

# 检测架构
ARCH := $(shell uname -m)
COMPOSE_FILE := docker-compose.yml

ifeq ($(ARCH),aarch64)
    COMPOSE_FILE := docker-compose.arm.yml
endif
ifeq ($(ARCH),arm64)
    COMPOSE_FILE := docker-compose.arm.yml
endif

# 默认目标
help:
	@echo "代码书院实验室纳新系统 - 可用命令："
	@echo ""
	@echo "  make install    - 首次安装部署"
	@echo "  make update     - 更新代码并重新部署"
	@echo "  make restart    - 重启所有服务"
	@echo "  make stop       - 停止所有服务"
	@echo "  make status     - 查看服务状态"
	@echo "  make logs       - 查看服务日志"
	@echo "  make clean      - 清理并重新部署"
	@echo ""
	@echo "当前架构: $(ARCH)"
	@echo "使用配置: $(COMPOSE_FILE)"

# 首次安装
install:
	./deploy.sh install

# 更新代码
update:
	./deploy.sh update

# 重启服务
restart:
	./deploy.sh restart

# 停止服务
stop:
	./deploy.sh stop

# 查看状态
status:
	./deploy.sh status

# 查看日志
logs:
	./deploy.sh logs

# 清理重建
clean:
	./deploy.sh clean

# 备份数据库
backup:
	@mkdir -p backups
	@docker exec recruitment-mysql mysqldump -u recruitment_user -p$$MYSQL_PASSWORD recruitment_db > backups/backup_$$(date +%Y%m%d_%H%M%S).sql
	@echo "数据库备份完成: backups/backup_$$(date +%Y%m%d_%H%M%S).sql"

# 健康检查
health:
	@echo "检查服务健康状态..."
	@curl -s http://localhost:45000/health > /dev/null && echo "✓ 后端服务正常" || echo "✗ 后端服务异常"
	@curl -s http://localhost:43000/health > /dev/null && echo "✓ 前端服务正常" || echo "✗ 前端服务异常"
	@curl -s http://localhost:43000/api/health > /dev/null && echo "✓ API 代理正常" || echo "✗ API 代理异常"