# 🔧 申请配置调试指南

## 🚨 问题现象

您在管理后台配置了申请时间，但前端仍显示"申请暂未开放"。

## 🔍 调试步骤

### 1. 检查后端配置 API

```bash
# 测试配置接口
curl http://localhost:45000/api/applications/config
```

**预期响应：**
```json
{
  "freshmanEnabled": true,
  "sophomoreEnabled": true,
  "deadline": "2025-09-30T13:14:12.639Z",
  "startTime": "2025-08-31T13:14:12.639Z",
  "allowedGrades": ["大一", "大二"]
}
```

### 2. 检查前端配置加载

**打开浏览器开发者工具：**
1. 访问 http://localhost:43000/applications/new
2. 打开 F12 开发者工具
3. 查看 Console 标签页
4. 应该看到调试信息：

```
=== 加载申请配置 ===
申请配置数据: {freshmanEnabled: true, sophomoreEnabled: true, ...}
=== 检查申请开放状态 ===
配置对象: {freshmanEnabled: true, sophomoreEnabled: true, ...}
大一开放状态: true
大二开放状态: true
判断结果: false
```

### 3. 检查数据库中的配置

```bash
# 查看数据库中的系统配置
docker exec recruitment-mysql mysql -u root -p -e "
USE recruitment_db;
SELECT \`key\`, value, description FROM system_configs WHERE isActive=1;
"
```

## 🔧 可能的问题和解决方案

### 问题1: 配置接口返回错误数据

**检查方法：**
```bash
curl http://localhost:45000/api/applications/config
```

**如果返回错误，检查后端日志：**
```bash
docker logs recruitment-backend | grep "applications/config"
```

### 问题2: 前端无法访问配置接口

**检查方法：**
- 浏览器开发者工具 → Network 标签
- 查看是否有 `/api/applications/config` 请求
- 检查请求状态码和响应

### 问题3: 配置数据类型问题

**可能原因：**
- 数据库中存储的是字符串 `"true"`
- 前端期望的是布尔值 `true`

**检查后端配置接口代码：**
```typescript
// 应该进行类型转换
freshmanEnabled: freshmanEnabled === 'true',
sophomoreEnabled: sophomoreEnabled === 'true',
```

## 🚀 立即调试

### 步骤1: 重新部署包含调试日志

```bash
./deploy.sh update
```

### 步骤2: 测试配置接口

```bash
# 测试后端配置接口
curl http://localhost:45000/api/applications/config

# 测试前端代理
curl http://localhost:43000/api/applications/config
```

### 步骤3: 查看前端调试信息

1. 访问 http://localhost:43000/applications/new
2. 打开浏览器开发者工具
3. 查看 Console 中的调试信息

### 步骤4: 检查管理员配置是否生效

1. 登录管理员后台：http://localhost:43000/admin/config
2. 确认配置开关状态
3. 保存配置

## 📊 预期的调试输出

**浏览器 Console：**
```
=== 加载申请配置 ===
申请配置数据: {freshmanEnabled: true, sophomoreEnabled: true, ...}
=== 检查申请开放状态 ===
判断结果: false  # 应该是 false（表示申请开放）
```

**如果判断结果是 true，说明配置数据有问题**

---

**立即执行：**
```bash
# 1. 更新部署
./deploy.sh update

# 2. 测试配置接口
curl http://localhost:45000/api/applications/config
```

然后查看浏览器控制台的调试信息！