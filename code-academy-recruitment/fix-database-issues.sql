-- 修复数据库中的问题
-- 1. 修复面试记录中applicationId为NULL的问题
-- 2. 重置错误的notificationSent标志

-- 查看有问题的面试记录
SELECT 
    i.id as interview_id,
    i.applicationId,
    i.scheduledAt,
    i.notificationSent,
    i.result,
    i.isCompleted
FROM interviews i
WHERE i.applicationId IS NULL;

-- 查找可能匹配的申请记录
SELECT 
    a.id as application_id,
    a.status,
    a.userId,
    u.name,
    u.email,
    a.createdAt
FROM applications a
JOIN users u ON u.id = a.userId
WHERE a.status IN ('interview_scheduled', 'interviewed')
    AND NOT EXISTS (
        SELECT 1 FROM interviews i2 
        WHERE i2.applicationId = a.id
    );

-- 如果找到匹配的记录，手动修复（需要根据实际情况调整ID）
-- UPDATE interviews 
-- SET applicationId = 'YOUR_APPLICATION_ID_HERE'
-- WHERE id = 'YOUR_INTERVIEW_ID_HERE' AND applicationId IS NULL;

-- 例如，基于之前的日志，可能需要：
UPDATE interviews 
SET applicationId = '7837d6c3-212a-4886-90c8-0e2e847f42db'
WHERE id = 'ac1812d2-0a76-44c5-b572-5b5dee5d0649' AND applicationId IS NULL;

UPDATE interviews 
SET applicationId = '8f9a2b4c-5d3e-4f1a-b2c3-1a4d5e6f7a8b'  -- 需要找到正确的application ID
WHERE id = '010ea27b-4896-4198-975f-60bfcb6827c4' AND applicationId IS NULL;

-- 重置错误的notificationSent标志
-- 只有当申请状态为accepted或rejected时，notificationSent才应该为true
UPDATE interviews i
JOIN applications a ON i.applicationId = a.id
SET i.notificationSent = false
WHERE i.notificationSent = true 
    AND a.status NOT IN ('accepted', 'rejected');

-- 验证修复结果
SELECT 
    i.id,
    i.applicationId,
    i.notificationSent,
    i.result,
    a.status as application_status,
    u.name,
    u.email
FROM interviews i
LEFT JOIN applications a ON a.id = i.applicationId
LEFT JOIN users u ON u.id = a.userId
ORDER BY i.createdAt DESC;