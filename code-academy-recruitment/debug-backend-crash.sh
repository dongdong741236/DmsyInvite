#!/bin/bash

# 后端容器崩溃诊断脚本

echo "🔍 后端容器崩溃诊断"
echo "=================="

echo "🛑 停止后端容器..."
docker compose -f docker-compose.working.yml stop backend

echo "🔍 检查容器退出状态..."
if docker ps -a --filter "name=recruitment-backend" --format "{{.Status}}" | grep -q "Exited"; then
    EXIT_CODE=$(docker ps -a --filter "name=recruitment-backend" --format "{{.Status}}" | grep -o "Exited ([0-9]*)" | grep -o "[0-9]*")
    echo "容器退出码: $EXIT_CODE"
    
    case $EXIT_CODE in
        0)
            echo "✅ 正常退出"
            ;;
        1)
            echo "❌ 一般错误"
            ;;
        125)
            echo "❌ Docker 守护进程错误"
            ;;
        126)
            echo "❌ 容器命令不可执行"
            ;;
        127)
            echo "❌ 容器命令未找到"
            ;;
        *)
            echo "❌ 未知错误码: $EXIT_CODE"
            ;;
    esac
fi

echo ""
echo "📋 完整的容器日志:"
echo "=================="
docker logs recruitment-backend 2>&1

echo ""
echo "🔍 容器详细信息:"
docker inspect recruitment-backend --format '{{json .State}}' | jq '.' 2>/dev/null || docker inspect recruitment-backend --format '{{.State.Status}} {{.State.ExitCode}} {{.State.Error}}'

echo ""
echo "🧪 测试容器基础功能..."

echo "测试1: 检查镜像是否正确构建"
if docker images | grep -q "code-academy-recruitment-backend"; then
    echo "✅ 后端镜像存在"
    docker images | grep "code-academy-recruitment-backend"
else
    echo "❌ 后端镜像不存在"
fi

echo ""
echo "测试2: 尝试手动启动容器（无依赖）"
docker run --rm --name backend-test \
    -e NODE_ENV=development \
    -e DB_HOST=localhost \
    -e REDIS_HOST=localhost \
    code-academy-recruitment-backend \
    node --version 2>/dev/null && echo "✅ Node.js 可执行" || echo "❌ Node.js 不可执行"

echo ""
echo "测试3: 检查应用文件"
docker run --rm --name backend-test \
    code-academy-recruitment-backend \
    ls -la /app/ 2>/dev/null && echo "✅ 应用文件存在" || echo "❌ 应用文件缺失"

echo ""
echo "测试4: 检查编译文件"
docker run --rm --name backend-test \
    code-academy-recruitment-backend \
    ls -la /app/dist/ 2>/dev/null && echo "✅ 编译文件存在" || echo "❌ 编译文件缺失"

echo ""
echo "测试5: 尝试启动应用（无数据库）"
echo "启动命令测试..."
docker run --rm --name backend-test \
    -e NODE_ENV=development \
    code-academy-recruitment-backend \
    timeout 5 node dist/index.js 2>&1 || echo "应用启动测试完成"

echo ""
echo "🔧 诊断结果和建议:"
echo "=================="

if docker logs recruitment-backend 2>&1 | grep -q "Error"; then
    echo "❌ 发现错误日志"
    echo "错误信息:"
    docker logs recruitment-backend 2>&1 | grep "Error"
elif docker logs recruitment-backend 2>&1 | wc -l | grep -q "0"; then
    echo "❌ 无日志输出，容器立即崩溃"
    echo "可能原因:"
    echo "1. 镜像构建有问题"
    echo "2. 启动命令错误"
    echo "3. 依赖缺失"
    echo ""
    echo "建议:"
    echo "1. 重新构建镜像: docker compose -f docker-compose.working.yml build --no-cache backend"
    echo "2. 检查 Dockerfile: cat backend/Dockerfile"
    echo "3. 手动测试镜像: docker run --rm -it code-academy-recruitment-backend sh"
else
    echo "ℹ️  有日志输出，分析中..."
fi

echo ""
echo "📞 下一步操作建议:"
echo "1. 如果是镜像问题: 重新构建"
echo "2. 如果是依赖问题: 检查 package.json"
echo "3. 如果是代码问题: 检查 TypeScript 编译"
echo "4. 如果是网络问题: 使用 --network host 模式测试"