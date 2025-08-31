#!/bin/bash

# 后端容器诊断脚本

echo "🔍 后端容器诊断"
echo "=============="

echo "📊 容器状态检查..."
docker ps -a --filter "name=recruitment-backend" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo ""
echo "📋 容器详细信息..."
if docker ps -a --filter "name=recruitment-backend" --format "{{.Names}}" | grep -q recruitment-backend; then
    CONTAINER_ID=$(docker ps -a --filter "name=recruitment-backend" --format "{{.ID}}")
    echo "容器ID: $CONTAINER_ID"
    
    # 检查退出状态
    EXIT_CODE=$(docker inspect recruitment-backend --format '{{.State.ExitCode}}' 2>/dev/null || echo "unknown")
    echo "退出码: $EXIT_CODE"
    
    # 检查错误信息
    ERROR_MSG=$(docker inspect recruitment-backend --format '{{.State.Error}}' 2>/dev/null || echo "none")
    echo "错误信息: $ERROR_MSG"
    
    # 检查重启次数
    RESTART_COUNT=$(docker inspect recruitment-backend --format '{{.RestartCount}}' 2>/dev/null || echo "0")
    echo "重启次数: $RESTART_COUNT"
else
    echo "❌ 后端容器不存在"
fi

echo ""
echo "📋 尝试获取日志..."
docker logs recruitment-backend 2>&1 || echo "无法获取日志"

echo ""
echo "🔍 检查镜像..."
if docker images | grep -q "code-academy-recruitment-backend"; then
    echo "✅ 后端镜像存在"
    docker images | grep "code-academy-recruitment-backend"
else
    echo "❌ 后端镜像不存在"
fi

echo ""
echo "🧪 测试镜像基本功能..."
echo "测试 Node.js 版本:"
docker run --rm code-academy-recruitment-backend node --version 2>/dev/null || echo "❌ 无法运行 Node.js"

echo "测试应用文件:"
docker run --rm code-academy-recruitment-backend ls -la /app/ 2>/dev/null || echo "❌ 应用目录有问题"

echo "测试编译文件:"
docker run --rm code-academy-recruitment-backend ls -la /app/dist/ 2>/dev/null || echo "❌ 编译文件缺失"

echo ""
echo "🔧 尝试手动启动..."
echo "手动启动测试（5秒）:"
timeout 5 docker run --rm \
    -e NODE_ENV=development \
    -e DB_HOST=localhost \
    -e REDIS_HOST=localhost \
    code-academy-recruitment-backend \
    node dist/index.js 2>&1 || echo "手动启动测试完成"

echo ""
echo "🌐 网络检查..."
if docker network ls | grep -q "recruitment-network"; then
    echo "✅ 项目网络存在"
    echo "网络详情:"
    docker network inspect code-academy-recruitment_recruitment-network --format '{{range .Containers}}{{.Name}}: {{.IPv4Address}}{{"\n"}}{{end}}' 2>/dev/null || echo "无法获取网络详情"
else
    echo "❌ 项目网络不存在"
fi

echo ""
echo "💾 数据库连接测试..."
if docker ps --filter "name=recruitment-mysql" --format "{{.Status}}" | grep -q "Up"; then
    echo "✅ MySQL 容器运行中"
    if docker exec recruitment-mysql mysqladmin ping >/dev/null 2>&1; then
        echo "✅ MySQL 服务正常"
    else
        echo "❌ MySQL 服务异常"
    fi
else
    echo "❌ MySQL 容器未运行"
fi

if docker ps --filter "name=recruitment-redis" --format "{{.Status}}" | grep -q "Up"; then
    echo "✅ Redis 容器运行中"
    if docker exec recruitment-redis redis-cli ping >/dev/null 2>&1; then
        echo "✅ Redis 服务正常"
    else
        echo "❌ Redis 服务异常"
    fi
else
    echo "❌ Redis 容器未运行"
fi

echo ""
echo "🔧 建议的修复步骤:"
echo "=================="

if [ "$EXIT_CODE" = "125" ]; then
    echo "❌ Docker 守护进程错误"
    echo "建议: 重启 Docker 服务"
    echo "sudo systemctl restart docker"
elif [ "$EXIT_CODE" = "126" ]; then
    echo "❌ 容器命令不可执行"
    echo "建议: 检查 Dockerfile 中的 CMD 命令"
elif [ "$EXIT_CODE" = "127" ]; then
    echo "❌ 容器命令未找到"
    echo "建议: 检查 Node.js 是否正确安装"
elif [ "$EXIT_CODE" = "1" ]; then
    echo "❌ 应用启动错误"
    echo "建议: 检查应用代码或依赖"
else
    echo "ℹ️  未知错误，建议完整重建"
fi

echo ""
echo "📞 立即修复命令:"
echo "./deploy.sh clean    # 完整重新部署"
echo ""
echo "🔍 进一步调试:"
echo "docker run --rm -it code-academy-recruitment-backend sh  # 进入容器调试"