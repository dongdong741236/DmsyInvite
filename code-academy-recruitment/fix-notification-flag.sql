-- 修复错误的 notificationSent 标志
-- 只有当面试结果已经通过邮件发送给申请者时，notificationSent 才应该为 true
-- 这个脚本将重置所有未真正发送结果通知的面试记录

-- 查看当前状态
SELECT 
    i.id,
    i.isCompleted,
    i.result,
    i.notificationSent,
    a.status as application_status,
    u.email,
    u.name
FROM interviews i
JOIN applications a ON i.applicationId = a.id
JOIN users u ON a.userId = u.id
WHERE i.notificationSent = true;

-- 重置 notificationSent 标志
-- 只保留那些申请状态为 accepted 或 rejected 的记录（这些是真正发送了结果通知的）
UPDATE interviews i
JOIN applications a ON i.applicationId = a.id
SET i.notificationSent = false
WHERE i.notificationSent = true 
  AND a.status NOT IN ('accepted', 'rejected');

-- 验证修复结果
SELECT 
    COUNT(*) as total_interviews,
    SUM(CASE WHEN notificationSent = true THEN 1 ELSE 0 END) as notified_count,
    SUM(CASE WHEN isCompleted = true THEN 1 ELSE 0 END) as completed_count
FROM interviews;

-- 查看修复后的状态
SELECT 
    i.id,
    i.isCompleted,
    i.result,
    i.notificationSent,
    a.status as application_status
FROM interviews i
JOIN applications a ON i.applicationId = a.id
WHERE i.isCompleted = true;