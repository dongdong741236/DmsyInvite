.PHONY: help build up down restart logs clean backup restore dev prod

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

# 构建镜像
build:
	docker-compose build

# 启动服务
up:
	docker-compose up -d
	@echo "服务已启动!"
	@echo "前端: http://localhost:3000"
	@echo "后端: http://localhost:5000"

# 停止服务
down:
	docker-compose down

# 重启服务
restart:
	docker-compose restart

# 查看日志
logs:
	docker-compose logs -f

# 清理
clean:
	docker-compose down -v
	docker system prune -f

# 备份数据库
backup:
	@mkdir -p backups
	@docker exec recruitment-postgres pg_dump -U recruitment_user recruitment_db > backups/backup_$$(date +%Y%m%d_%H%M%S).sql
	@echo "数据库备份完成: backups/backup_$$(date +%Y%m%d_%H%M%S).sql"

# 恢复数据库
restore:
	@read -p "输入备份文件路径: " backup_file; \
	docker exec -i recruitment-postgres psql -U recruitment_user recruitment_db < $$backup_file

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
	@curl -s http://localhost:5000/health > /dev/null && echo "✓ 后端服务正常" || echo "✗ 后端服务异常"
	@curl -s http://localhost:3000/health > /dev/null && echo "✓ 前端服务正常" || echo "✗ 前端服务异常"