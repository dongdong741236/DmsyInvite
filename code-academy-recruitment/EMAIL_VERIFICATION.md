# 📧 邮箱验证码功能说明

## 🔄 新的注册流程

### 原流程 vs 新流程

**原流程（已废弃）:**
1. 填写注册信息 → 2. 创建账号 → 3. 发送邮件链接 → 4. 点击链接验证

**新流程（当前）:**
1. 输入邮箱 → 2. 接收验证码 → 3. 输入验证码 → 4. 填写信息完成注册

## 🔧 技术实现

### 后端接口

#### 1. 发送验证码
```
POST /api/auth/send-verification-code
```

**请求体:**
```json
{
  "email": "student@stu.example.edu.cn"
}
```

**响应:**
```json
{
  "message": "验证码已发送到您的邮箱，有效期10分钟",
  "expiresAt": "2025-08-31T10:00:00.000Z"
}
```

#### 2. 验证验证码
```
POST /api/auth/verify-email-code
```

**请求体:**
```json
{
  "email": "student@stu.example.edu.cn",
  "code": "123456"
}
```

**响应:**
```json
{
  "message": "邮箱验证成功",
  "verified": true
}
```

#### 3. 注册用户（需要先验证邮箱）
```
POST /api/auth/register
```

**请求体:**
```json
{
  "email": "student@stu.example.edu.cn",
  "password": "password123",
  "name": "张三"
}
```

### 前端页面

#### 新的注册页面组件
- `RegisterWithCode.tsx` - 三步骤注册流程
- 步骤指示器显示当前进度
- 验证码倒计时和重发功能
- 表单验证和错误处理

#### 三个步骤

1. **邮箱验证步骤**
   - 输入校内邮箱
   - 邮箱格式和域名验证
   - 发送验证码

2. **验证码步骤**
   - 输入6位数验证码
   - 60秒倒计时重发
   - 验证码格式验证

3. **注册信息步骤**
   - 填写姓名和密码
   - 密码强度验证
   - 完成注册

## 🔒 安全特性

### 验证码安全
- **6位随机数字** - 100万种组合
- **10分钟有效期** - 防止长期有效
- **最多5次尝试** - 防止暴力破解
- **Redis 存储** - 分布式缓存，性能好

### 邮箱验证
- **域名限制** - 只允许指定后缀邮箱
- **重复注册检查** - 防止重复注册
- **30分钟验证窗口** - 验证成功后30分钟内可注册

### 数据存储
```redis
# 验证码存储（10分钟）
email_verification:user@stu.edu.cn = {
  "code": "123456",
  "expiresAt": "2025-08-31T10:00:00.000Z",
  "attempts": 0
}

# 验证成功标记（30分钟）
email_verified:user@stu.edu.cn = "true"
```

## 📧 邮件模板

### 验证码邮件内容
```html
代码书院 - 邮箱验证码

您正在注册代码书院实验室纳新系统，您的邮箱验证码是：

┌─────────────┐
│   123456    │  (大号字体，居中显示)
└─────────────┘

验证码有效期为 10 分钟，请及时使用。
```

## 🧪 测试功能

### 运行测试脚本
```bash
./test-email-verification.sh
```

### 手动测试步骤

1. **测试发送验证码:**
```bash
curl -X POST http://localhost:45000/api/auth/send-verification-code \
  -H "Content-Type: application/json" \
  -d '{"email": "test@stu.example.edu.cn"}'
```

2. **测试验证码验证:**
```bash
curl -X POST http://localhost:45000/api/auth/verify-email-code \
  -H "Content-Type: application/json" \
  -d '{"email": "test@stu.example.edu.cn", "code": "123456"}'
```

3. **测试注册（需要先验证）:**
```bash
curl -X POST http://localhost:45000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "test@stu.example.edu.cn", "password": "password123", "name": "测试用户"}'
```

## ⚙️ 配置要求

### 必须配置邮箱服务

在 `.env` 文件中配置：
```bash
# 邮箱服务器配置
EMAIL_HOST=smtp.your-domain.com
EMAIL_PORT=587
EMAIL_USER=noreply@your-domain.com
EMAIL_PASS=your_email_password
EMAIL_FROM=代码书院实验室 <noreply@your-domain.com>

# 允许的邮箱域名
ALLOWED_EMAIL_DOMAIN=@stu.your-university.edu.cn
```

### 支持的邮箱服务商

- **企业邮箱**: 腾讯企业邮箱、阿里云邮箱
- **学校邮箱**: 大部分高校邮箱系统
- **公共邮箱**: Gmail、Outlook（需要应用密码）

## 🎯 部署新功能

### 1. 修复当前部署问题
```bash
# 先修复 JSONB 问题
./fix-jsonb-and-test.sh
```

### 2. 重新构建包含验证码功能
```bash
# 重新构建前后端
docker compose -f docker-compose.working.yml build --no-cache
docker compose -f docker-compose.working.yml up -d
```

### 3. 测试验证码功能
```bash
./test-email-verification.sh
```

## 📱 用户体验

### 注册流程体验
1. **简洁直观** - 三步骤清晰展示
2. **实时反馈** - 倒计时、验证状态
3. **错误处理** - 友好的错误提示
4. **防误操作** - 可返回上一步修改

### 安全提示
- 验证码10分钟有效
- 最多尝试5次
- 支持重新发送
- 防止重复注册

---

**立即部署验证码功能：**
```bash
# 1. 修复后端问题
./fix-jsonb-and-test.sh

# 2. 测试验证码功能  
./test-email-verification.sh
```