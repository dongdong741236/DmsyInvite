# API 端点文档

## 基础信息

- **基础URL**: `http://localhost:3001/api`
- **认证方式**: JWT Bearer Token
- **Content-Type**: `application/json`
- **文件上传**: `multipart/form-data`

## 认证说明

除了公开端点外，所有API都需要在请求头中携带JWT Token：

```http
Authorization: Bearer <token>
```

## API 端点列表

### 1. 认证相关 `/auth`

#### 1.1 用户注册
- **端点**: `POST /auth/register`
- **权限**: 公开
- **描述**: 用户注册新账号

**请求体**:
```json
{
  "name": "张三",
  "email": "zhangsan@example.com",
  "password": "password123"
}
```

**响应**:
```json
{
  "message": "注册成功，请查收邮件进行验证",
  "user": {
    "id": "uuid",
    "name": "张三",
    "email": "zhangsan@example.com",
    "role": "user"
  }
}
```

#### 1.2 用户登录
- **端点**: `POST /auth/login`
- **权限**: 公开
- **描述**: 用户登录获取Token

**请求体**:
```json
{
  "email": "zhangsan@example.com",
  "password": "password123"
}
```

**响应**:
```json
{
  "token": "jwt-token-string",
  "user": {
    "id": "uuid",
    "name": "张三",
    "email": "zhangsan@example.com",
    "role": "user",
    "emailVerified": true
  }
}
```

#### 1.3 邮箱验证
- **端点**: `GET /auth/verify-email`
- **权限**: 公开
- **描述**: 验证邮箱地址

**查询参数**:
- `token`: 验证令牌

**响应**:
```json
{
  "message": "邮箱验证成功"
}
```

#### 1.4 重发验证邮件
- **端点**: `POST /auth/resend-verification`
- **权限**: 需要登录
- **描述**: 重新发送验证邮件

**响应**:
```json
{
  "message": "验证邮件已发送"
}
```

#### 1.5 获取当前用户
- **端点**: `GET /auth/me`
- **权限**: 需要登录
- **描述**: 获取当前登录用户信息

**响应**:
```json
{
  "id": "uuid",
  "name": "张三",
  "email": "zhangsan@example.com",
  "role": "user",
  "emailVerified": true
}
```

### 2. 申请相关 `/applications`

#### 2.1 获取我的申请列表
- **端点**: `GET /applications/my`
- **权限**: 需要登录
- **描述**: 获取当前用户的所有申请

**响应**:
```json
[
  {
    "id": "uuid",
    "studentId": "2021000001",
    "major": "计算机科学与技术",
    "grade": "大二",
    "status": "pending",
    "createdAt": "2024-01-01T00:00:00Z",
    "interview": {
      "id": "uuid",
      "scheduledAt": "2024-01-10T14:00:00Z",
      "room": {
        "name": "教室A",
        "location": "教学楼101"
      },
      "isCompleted": false,
      "notificationSent": false
    }
  }
]
```

#### 2.2 获取单个申请详情
- **端点**: `GET /applications/:id`
- **权限**: 需要登录（只能查看自己的申请）
- **描述**: 获取申请详细信息

**响应**:
```json
{
  "id": "uuid",
  "studentId": "2021000001",
  "campusCardId": "1234567890",
  "phone": "13800138000",
  "major": "计算机科学与技术",
  "grade": "大二",
  "personalPhoto": "/uploads/photos/xxx.jpg",
  "studentCardPhoto": "/uploads/cards/xxx.jpg",
  "introduction": "自我介绍内容",
  "skills": "技能特长",
  "experience": "项目经验",
  "experienceAttachments": ["file1.pdf", "file2.pdf"],
  "motivation": "申请动机",
  "portfolio": "https://github.com/username",
  "status": "pending",
  "reviewNotes": null,
  "interview": null,
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z"
}
```

#### 2.3 创建新申请
- **端点**: `POST /applications`
- **权限**: 需要登录且邮箱已验证
- **描述**: 提交新的申请

**请求体**:
```json
{
  "studentId": "2021000001",
  "campusCardId": "1234567890",
  "phone": "13800138000",
  "major": "计算机科学与技术",
  "grade": "大二",
  "introduction": "自我介绍",
  "skills": "技能特长",
  "experience": "项目经验",
  "motivation": "申请动机",
  "portfolio": "https://github.com/username",
  "gradeSpecificInfo": {
    "sophomoreInfo": {
      "gpa": 3.5,
      "programmingGrade": "90",
      "isTransferStudent": "false"
    }
  }
}
```

#### 2.4 上传文件
- **端点**: `POST /applications/upload`
- **权限**: 需要登录
- **描述**: 上传申请相关文件
- **Content-Type**: `multipart/form-data`

**表单字段**:
- `type`: 文件类型 (personalPhoto|studentCard|experienceAttachment)
- `file`: 文件内容

**响应**:
```json
{
  "filePath": "/uploads/2024/01/filename.jpg"
}
```

#### 2.5 获取我的面试安排
- **端点**: `GET /applications/my/interviews`
- **权限**: 需要登录
- **描述**: 获取面试安排信息

**响应**:
```json
[
  {
    "applicationId": "uuid",
    "interviewId": "uuid",
    "scheduledAt": "2024-01-10T14:00:00Z",
    "room": {
      "name": "教室A",
      "location": "教学楼101"
    },
    "status": "interview_scheduled",
    "isCompleted": false,
    "notificationSent": false
  }
]
```

### 3. 管理员端点 `/admin`

#### 3.1 用户管理

##### 获取所有用户
- **端点**: `GET /admin/users`
- **权限**: 管理员
- **描述**: 获取系统所有用户

##### 更新用户角色
- **端点**: `PUT /admin/users/:id/role`
- **权限**: 管理员
- **请求体**:
```json
{
  "role": "admin|interviewer|user"
}
```

#### 3.2 申请管理

##### 获取所有申请
- **端点**: `GET /admin/applications`
- **权限**: 管理员
- **查询参数**:
  - `status`: 状态筛选
  - `grade`: 年级筛选
  - `year`: 年度筛选

##### 审核申请
- **端点**: `PUT /admin/applications/:id/review`
- **权限**: 管理员
- **请求体**:
```json
{
  "status": "approved|rejected",
  "reviewNotes": "审核备注"
}
```

#### 3.3 面试管理

##### 获取所有面试
- **端点**: `GET /admin/interviews`
- **权限**: 管理员

##### 创建面试安排
- **端点**: `POST /admin/interviews`
- **权限**: 管理员
- **请求体**:
```json
{
  "applicationId": "uuid",
  "roomId": "uuid",
  "scheduledAt": "2024-01-10T14:00:00Z"
}
```

##### 更新面试评价
- **端点**: `PUT /admin/interviews/:id/evaluation`
- **权限**: 管理员
- **请求体**:
```json
{
  "evaluationScores": {
    "technical": 8,
    "communication": 9,
    "teamwork": 8,
    "motivation": 9,
    "overall": 8.5
  },
  "interviewerNotes": "面试评价",
  "result": "passed|failed|pending",
  "questionAnswers": [
    {
      "questionId": "uuid",
      "question": "问题内容",
      "answer": "回答内容",
      "score": 8
    }
  ],
  "isCompleted": true
}
```

##### 发送面试结果通知
- **端点**: `POST /admin/interviews/:id/send-notification`
- **权限**: 管理员
- **请求体**:
```json
{
  "templateType": "interview_pass|interview_fail"
}
```

#### 3.4 教室管理

##### 获取所有教室
- **端点**: `GET /admin/rooms`
- **权限**: 管理员

##### 创建教室
- **端点**: `POST /admin/rooms`
- **权限**: 管理员
- **请求体**:
```json
{
  "name": "教室A",
  "location": "教学楼101",
  "capacity": 5,
  "facilities": "投影仪、白板",
  "isActive": true,
  "interviewerIds": ["uuid1", "uuid2"]
}
```

#### 3.5 面试官管理

##### 获取所有面试官
- **端点**: `GET /admin/interviewers`
- **权限**: 管理员

##### 创建面试官
- **端点**: `POST /admin/interviewers`
- **权限**: 管理员
- **请求体**:
```json
{
  "name": "张老师",
  "email": "zhang@example.com",
  "password": "123456",
  "phone": "13800138000",
  "title": "技术负责人",
  "department": "代码书院",
  "expertise": "前端开发"
}
```

#### 3.6 邮件模板管理

##### 获取邮件模板
- **端点**: `GET /admin/email-templates`
- **权限**: 管理员

##### 更新邮件模板
- **端点**: `PUT /admin/email-templates/:type`
- **权限**: 管理员
- **请求体**:
```json
{
  "name": "面试通过通知",
  "subject": "恭喜您通过面试",
  "htmlContent": "<html>邮件内容</html>",
  "textContent": "纯文本内容",
  "isActive": true
}
```

#### 3.7 系统配置

##### 获取配置
- **端点**: `GET /admin/configs`
- **权限**: 管理员

##### 更新配置
- **端点**: `PUT /admin/configs/:key`
- **权限**: 管理员
- **请求体**:
```json
{
  "value": "配置值",
  "description": "配置说明"
}
```

##### 获取招新状态
- **端点**: `GET /admin/recruitment-status`
- **权限**: 管理员
- **响应**:
```json
{
  "freshmanEnabled": true,
  "sophomoreEnabled": false,
  "deadline": "2024-02-01T00:00:00Z",
  "startTime": "2024-01-01T00:00:00Z"
}
```

#### 3.8 年度管理

##### 获取所有年度
- **端点**: `GET /admin/recruitment-years`
- **权限**: 管理员

##### 创建新年度
- **端点**: `POST /admin/recruitment-years`
- **权限**: 管理员
- **请求体**:
```json
{
  "year": 2024,
  "name": "2024年春季招新",
  "description": "2024年春季学期招新",
  "startDate": "2024-01-01",
  "endDate": "2024-02-28"
}
```

### 4. 面试官端点 `/interviewer`

#### 4.1 获取我的面试列表
- **端点**: `GET /interviewer/interviews`
- **权限**: 面试官
- **描述**: 获取分配给当前面试官的所有面试

**响应**:
```json
[
  {
    "id": "uuid",
    "scheduledAt": "2024-01-10T14:00:00Z",
    "application": {
      "id": "uuid",
      "user": {
        "name": "张三",
        "email": "zhangsan@example.com"
      },
      "grade": "大二",
      "major": "计算机科学与技术",
      "phone": "13800138000"
    },
    "room": {
      "name": "教室A",
      "location": "教学楼101"
    },
    "isCompleted": false,
    "result": "pending"
  }
]
```

#### 4.2 获取今日面试
- **端点**: `GET /interviewer/interviews/today`
- **权限**: 面试官
- **描述**: 获取今天的面试安排

#### 4.3 获取单个面试详情
- **端点**: `GET /interviewer/interviews/:id`
- **权限**: 面试官（只能查看自己参与的面试）

#### 4.4 更新面试评价
- **端点**: `PUT /interviewer/interviews/:id/evaluation`
- **权限**: 面试官（只能更新自己参与的面试）
- **请求体**: 同管理员的面试评价接口

#### 4.5 获取面试问题库
- **端点**: `GET /interviewer/questions`
- **权限**: 面试官
- **描述**: 获取面试问题模板

**响应**:
```json
[
  {
    "id": "uuid",
    "question": "请介绍一下你最熟悉的编程语言",
    "category": "technical",
    "description": "考察技术基础",
    "isActive": true
  }
]
```

#### 4.6 获取面试统计
- **端点**: `GET /interviewer/stats`
- **权限**: 面试官
- **描述**: 获取面试统计数据

**响应**:
```json
{
  "totalInterviews": 10,
  "completedInterviews": 5,
  "todayInterviews": 2,
  "passRate": 0.6
}
```

### 5. 文件访问

#### 5.1 访问上传文件
- **端点**: `GET /uploads/:path`
- **权限**: 需要登录
- **描述**: 访问上传的文件（图片、PDF等）
- **说明**: 系统会验证用户是否有权限访问该文件

## 错误响应

所有API在发生错误时返回统一格式：

```json
{
  "error": "错误信息描述",
  "code": "ERROR_CODE",
  "details": {}
}
```

### 常见错误码

| HTTP状态码 | 错误码 | 说明 |
|-----------|--------|------|
| 400 | BAD_REQUEST | 请求参数错误 |
| 401 | UNAUTHORIZED | 未认证或Token过期 |
| 403 | FORBIDDEN | 无权限访问 |
| 404 | NOT_FOUND | 资源不存在 |
| 409 | CONFLICT | 资源冲突（如邮箱已存在） |
| 422 | VALIDATION_ERROR | 数据验证失败 |
| 500 | INTERNAL_ERROR | 服务器内部错误 |

## 分页参数

支持分页的端点通用参数：

- `page`: 页码（默认1）
- `limit`: 每页数量（默认20，最大100）
- `sort`: 排序字段
- `order`: 排序方向（asc|desc）

分页响应格式：

```json
{
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

## WebSocket 端点

### 实时通知
- **端点**: `ws://localhost:3001/notifications`
- **认证**: 连接时发送Token
- **事件**:
  - `interview_scheduled`: 面试安排通知
  - `status_changed`: 申请状态变更
  - `result_published`: 面试结果发布

## 限流说明

- 普通API: 100次/分钟
- 登录API: 5次/分钟
- 文件上传: 10次/分钟
- 邮件发送: 3次/分钟

## 安全说明

1. **HTTPS**: 生产环境必须使用HTTPS
2. **CORS**: 配置允许的域名列表
3. **文件上传**: 
   - 限制文件类型：图片(jpg,png,gif)、文档(pdf,doc,docx)
   - 限制文件大小：图片5MB、文档10MB
4. **SQL注入**: 使用参数化查询
5. **XSS防护**: 输入验证和输出转义
6. **敏感信息**: 面试结果在通知发送前不返回

## 版本管理

API版本通过URL路径管理：
- v1: `/api/v1/...` (当前版本)
- v2: `/api/v2/...` (规划中)

## 联系方式

API相关问题请联系：
- 邮箱: admin@codeacademy.com
- 文档: https://docs.codeacademy.com/api

---

*最后更新: 2024年1月*