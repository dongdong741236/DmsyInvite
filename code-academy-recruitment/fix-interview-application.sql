-- 修复面试记录中applicationId为NULL的问题
-- 这个问题是由于在创建面试时错误地处理了application关系

-- 查看当前有问题的记录
SELECT 
    i.id as interview_id,
    i.applicationId,
    i.scheduledAt,
    i.roomId,
    a.id as application_id,
    a.status,
    u.name,
    u.email
FROM interviews i
LEFT JOIN applications a ON a.status = 'interview_scheduled' 
    AND NOT EXISTS (
        SELECT 1 FROM interviews i2 
        WHERE i2.applicationId = a.id
    )
LEFT JOIN users u ON u.id = a.userId
WHERE i.applicationId IS NULL;

-- 修复方案：找到对应的application并更新
-- 由于面试记录可能已经创建，我们需要根据时间和状态来匹配

-- 如果只有一条记录需要修复（根据上面的查询结果）
-- UPDATE interviews 
-- SET applicationId = '7837d6c3-212a-4886-90c8-0e2e847f42db'
-- WHERE id = 'ac1812d2-0a76-44c5-b572-5b5dee5d0649';

-- 验证修复结果
SELECT 
    i.id,
    i.applicationId,
    i.scheduledAt,
    a.studentId,
    u.name,
    u.email
FROM interviews i
LEFT JOIN applications a ON a.id = i.applicationId
LEFT JOIN users u ON u.id = a.userId;