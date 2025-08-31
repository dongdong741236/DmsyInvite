# API 文档

## 基础信息

- 基础URL: `http://localhost:5000/api`
- 认证方式: JWT Bearer Token
- Content-Type: `application/json`

## 认证相关

### 注册
```
POST /auth/register
```

请求体：
```json
{
  "email": "user@stu.example.edu.cn",
  "password": "password123",
  "name": "张三"
}
```

响应：
```json
{
  "message": "Registration successful. Please verify your email.",
  "token": "jwt_token",
  "user": {
    "id": "uuid",
    "email": "user@stu.example.edu.cn",
    "name": "张三",
    "role": "applicant",
    "isEmailVerified": false
  }
}
```

### 登录
```
POST /auth/login
```

请求体：
```json
{
  "email": "user@stu.example.edu.cn",
  "password": "password123"
}
```

### 验证邮箱
```
GET /auth/verify-email?token=verification_token
```

## 申请管理

### 获取我的申请列表
```
GET /applications/my
```

需要认证：是

### 获取申请详情
```
GET /applications/:id
```

需要认证：是

### 创建申请
```
POST /applications
```

需要认证：是

请求体：
```json
{
  "studentId": "20210001",
  "phone": "13800138000",
  "major": "计算机科学与技术",
  "grade": "大二",
  "introduction": "自我介绍...",
  "skills": "技能特长...",
  "experience": "项目经验...",
  "motivation": "加入动机...",
  "portfolio": "https://github.com/username"
}
```

### 更新申请
```
PUT /applications/:id
```

需要认证：是
注意：只能在状态为 `pending` 时更新

## 面试管理

### 获取我的面试
```
GET /interviews/my
```

需要认证：是

### 获取面试详情
```
GET /interviews/:id
```

需要认证：是

## 管理员接口

所有管理员接口需要管理员权限。

### 获取统计数据
```
GET /admin/stats
```

### 用户管理
```
GET /admin/users?page=1&limit=20&search=keyword
GET /admin/users/:id
```

### 申请管理
```
GET /admin/applications?page=1&limit=20&status=pending&search=keyword
GET /admin/applications/:id
PUT /admin/applications/:id/status
```

更新状态请求体：
```json
{
  "status": "reviewing",
  "reviewNotes": "审核备注"
}
```

### 面试教室管理
```
GET /admin/rooms
POST /admin/rooms
PUT /admin/rooms/:id
DELETE /admin/rooms/:id
```

创建教室请求体：
```json
{
  "name": "会议室A",
  "location": "教学楼3楼301",
  "capacity": 10
}
```

### 面试管理
```
GET /admin/interviews?page=1&limit=20&date=2024-01-01
POST /admin/interviews
PUT /admin/interviews/:id
```

安排面试请求体：
```json
{
  "applicationId": "uuid",
  "roomId": "uuid",
  "scheduledAt": "2024-01-01T14:00:00Z"
}
```

更新面试请求体：
```json
{
  "interviewerNotes": "面试记录",
  "evaluationScores": {
    "technical": 85,
    "communication": 90,
    "teamwork": 88,
    "motivation": 92,
    "overall": 88
  },
  "result": "passed",
  "isCompleted": true
}
```

### 发送通知
```
POST /admin/interviews/:id/notify
POST /admin/applications/:id/notify-result
```

发送结果通知请求体：
```json
{
  "accepted": true,
  "feedback": "恭喜你！表现优秀..."
}
```

## 错误响应格式

```json
{
  "error": "错误信息描述"
}
```

常见状态码：
- 200: 成功
- 201: 创建成功
- 400: 请求参数错误
- 401: 未认证
- 403: 无权限
- 404: 资源不存在
- 500: 服务器错误