# 修复面试记录中Application为NULL的问题

## 问题描述

在 `/api/admin/interviews` 接口返回的数据中，`application` 字段为 `null`，导致无法显示申请人姓名和邮箱。

## 问题原因

在 `scheduleInterview` 函数中，创建 Interview 实体时错误地使用了整个 `application` 对象，而不是使用 `applicationId` 引用。这导致 TypeORM 在保存时可能将 `applicationId` 设置为 `null`。

### 错误的代码：
```typescript
const interview = interviewRepository.create({
  application,  // 错误：使用整个对象
  room,
  scheduledAt: new Date(scheduledAt),
  // ...
});
```

### 修复后的代码：
```typescript
const interview = interviewRepository.create({
  application: { id: applicationId } as Application,  // 正确：使用ID引用
  room,
  scheduledAt: new Date(scheduledAt),
  // ...
});
```

## 修复步骤

### 1. 后端代码修复（已完成）

**文件**: `backend/src/controllers/admin.controller.ts`
- 第487行：修改为使用ID引用而不是整个对象

### 2. 修复现有数据

执行以下SQL来修复已存在的问题数据：

```bash
# 进入MySQL容器
docker exec -it code-academy-recruitment-mysql-1 mysql -u root -prootpassword recruitment_db
```

```sql
-- 查看有问题的记录
SELECT 
    i.id as interview_id,
    i.applicationId,
    i.scheduledAt
FROM interviews i
WHERE i.applicationId IS NULL;

-- 如果确认只有一条记录需要修复
UPDATE interviews 
SET applicationId = '7837d6c3-212a-4886-90c8-0e2e847f42db'
WHERE id = 'ac1812d2-0a76-44c5-b572-5b5dee5d0649';

-- 验证修复
SELECT 
    i.id,
    i.applicationId,
    a.studentId,
    u.name,
    u.email
FROM interviews i
LEFT JOIN applications a ON a.id = i.applicationId
LEFT JOIN users u ON u.id = a.userId;
```

### 3. 重新部署

```bash
cd /workspace/code-academy-recruitment
./deploy.sh update
```

## 影响范围

1. **管理员面试列表** (`/api/admin/interviews`)
   - 现在会正确显示申请人信息

2. **面试安排功能** (`/api/admin/interviews/schedule`)
   - 新创建的面试记录会正确关联到申请

3. **面试通知功能** 
   - 能够正确获取申请人邮箱发送通知

## 验证方法

1. 访问管理员面试列表页面
2. 确认每个面试记录都显示了申请人姓名和邮箱
3. 创建新的面试安排，确认能正确关联申请记录
4. 发送面试通知，确认能正确获取申请人信息

## 预防措施

1. 在使用TypeORM关系时，优先使用ID引用而不是整个对象
2. 在保存实体前，验证关键关系字段不为null
3. 添加数据库约束，确保`applicationId`不能为NULL

```sql
-- 可以考虑添加约束
ALTER TABLE interviews 
MODIFY COLUMN applicationId VARCHAR(36) NOT NULL;
```

---

*修复日期: 2024年1月*
*问题类型: 数据关系错误*