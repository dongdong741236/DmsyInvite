#!/bin/bash

# 测试面试结果隐藏功能
# 确保用户在通知发送前无法看到面试结果

echo "=== 测试面试结果隐藏功能 ==="
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# API基础URL
API_URL="http://localhost:3001/api"

# 测试函数
test_result_hiding() {
    echo -e "${YELLOW}测试场景：用户查看未发送通知的面试结果${NC}"
    echo "1. 用户登录并获取申请详情"
    echo "2. 检查面试结果是否被隐藏"
    echo ""
    
    # 模拟用户登录
    echo "模拟用户登录..."
    USER_TOKEN=$(curl -s -X POST "$API_URL/auth/login" \
        -H "Content-Type: application/json" \
        -d '{"email":"test@example.com","password":"password123"}' \
        | grep -o '"token":"[^"]*' | grep -o '[^"]*$')
    
    if [ -z "$USER_TOKEN" ]; then
        echo -e "${RED}✗ 用户登录失败${NC}"
        return 1
    fi
    echo -e "${GREEN}✓ 用户登录成功${NC}"
    
    # 获取用户的申请列表
    echo "获取申请列表..."
    APPLICATIONS=$(curl -s -X GET "$API_URL/applications/my" \
        -H "Authorization: Bearer $USER_TOKEN")
    
    # 检查是否有面试
    HAS_INTERVIEW=$(echo "$APPLICATIONS" | grep -o '"interview":{[^}]*}')
    
    if [ -z "$HAS_INTERVIEW" ]; then
        echo -e "${YELLOW}! 该用户还没有面试安排${NC}"
        return 0
    fi
    
    # 检查面试结果字段
    echo "检查面试结果字段..."
    
    # 检查是否包含敏感字段
    if echo "$APPLICATIONS" | grep -q '"evaluationScores"'; then
        echo -e "${RED}✗ 错误：API返回了评分详情（evaluationScores）${NC}"
        return 1
    fi
    
    if echo "$APPLICATIONS" | grep -q '"interviewerNotes"'; then
        echo -e "${RED}✗ 错误：API返回了面试官备注（interviewerNotes）${NC}"
        return 1
    fi
    
    if echo "$APPLICATIONS" | grep -q '"feedback"'; then
        echo -e "${RED}✗ 错误：API返回了反馈信息（feedback）${NC}"
        return 1
    fi
    
    if echo "$APPLICATIONS" | grep -q '"questionAnswers"'; then
        echo -e "${RED}✗ 错误：API返回了问题答案（questionAnswers）${NC}"
        return 1
    fi
    
    # 检查notificationSent字段
    NOTIFICATION_SENT=$(echo "$APPLICATIONS" | grep -o '"notificationSent":[^,}]*' | grep -o 'true\|false')
    
    if [ "$NOTIFICATION_SENT" = "false" ]; then
        # 如果通知未发送，检查是否有结果
        if echo "$APPLICATIONS" | grep -q '"result":"passed"\|"result":"failed"'; then
            echo -e "${RED}✗ 错误：通知未发送但返回了面试结果${NC}"
            return 1
        else
            echo -e "${GREEN}✓ 通知未发送时，面试结果被正确隐藏${NC}"
        fi
    else
        echo -e "${YELLOW}! 该面试已发送通知，结果可见${NC}"
    fi
    
    echo -e "${GREEN}✓ 测试通过：敏感信息被正确过滤${NC}"
    return 0
}

# 运行测试
echo "开始测试..."
echo ""

test_result_hiding

echo ""
echo "=== 测试完成 ==="
echo ""
echo "修复说明："
echo "1. 后端API已更新，在用户获取申请详情时会检查 notificationSent 字段"
echo "2. 如果通知未发送，会自动过滤以下敏感信息："
echo "   - result (面试结果)"
echo "   - score (评分)"
echo "   - evaluationScores (详细评分)"
echo "   - interviewerNotes (面试官备注)"
echo "   - feedback (反馈)"
echo "   - questionAnswers (问题答案)"
echo "3. 前端已更新错误处理，避免白屏问题"
echo ""
echo "受影响的API端点："
echo "- GET /api/applications/my"
echo "- GET /api/applications/:id"
echo "- GET /api/applications/my/interviews"