#!/bin/bash

# 诊断容器立即崩溃的问题

echo "🔍 容器崩溃详细诊断"
echo "=================="

echo "🛑 停止后端容器..."
docker compose stop backend

echo "🗑️  删除后端容器..."
docker compose rm -f backend

echo "🧪 手动启动容器进行调试..."

# 使用交互模式启动容器
echo "1️⃣ 测试容器基本启动..."
docker run --rm --name backend-debug \
    --network code-academy-recruitment_recruitment-network \
    -e NODE_ENV=production \
    -e DB_HOST=mysql \
    -e REDIS_HOST=redis \
    -e DB_USER=recruitment_user \
    -e DB_PASSWORD=${DB_PASSWORD:-your_secure_password} \
    -e REDIS_PASSWORD=${REDIS_PASSWORD:-your_redis_password} \
    code-academy-recruitment-backend \
    sh -c "echo '容器启动成功'; ls -la /app/; echo '文件检查完成'"

echo ""
echo "2️⃣ 测试 Node.js 可执行性..."
docker run --rm --name backend-debug \
    --network code-academy-recruitment_recruitment-network \
    code-academy-recruitment-backend \
    sh -c "node --version && echo 'Node.js 正常'"

echo ""
echo "3️⃣ 测试应用文件..."
docker run --rm --name backend-debug \
    --network code-academy-recruitment_recruitment-network \
    code-academy-recruitment-backend \
    sh -c "ls -la /app/dist/ && echo '编译文件存在'"

echo ""
echo "4️⃣ 测试网络连接..."
docker run --rm --name backend-debug \
    --network code-academy-recruitment_recruitment-network \
    code-academy-recruitment-backend \
    sh -c "ping -c 1 mysql && echo 'MySQL 网络连通'"

docker run --rm --name backend-debug \
    --network code-academy-recruitment_recruitment-network \
    code-academy-recruitment-backend \
    sh -c "ping -c 1 redis && echo 'Redis 网络连通'"

echo ""
echo "5️⃣ 测试应用启动（详细输出）..."
docker run --rm --name backend-debug \
    --network code-academy-recruitment_recruitment-network \
    -e NODE_ENV=development \
    -e DB_HOST=mysql \
    -e REDIS_HOST=redis \
    -e DB_USER=recruitment_user \
    -e DB_PASSWORD=${DB_PASSWORD:-your_secure_password} \
    -e REDIS_PASSWORD=${REDIS_PASSWORD:-your_redis_password} \
    -e JWT_SECRET=test_secret \
    code-academy-recruitment-backend \
    timeout 10 node dist/index.js

echo ""
echo "🔧 如果上面的测试失败，问题可能是："
echo "1. 应用代码有错误"
echo "2. 数据库连接配置问题"
echo "3. 依赖缺失"
echo "4. 权限问题"

echo ""
echo "📞 进一步调试："
echo "进入容器: docker run --rm -it --network code-academy-recruitment_recruitment-network code-academy-recruitment-backend sh"
echo "查看环境: docker run --rm --network code-academy-recruitment_recruitment-network code-academy-recruitment-backend env"