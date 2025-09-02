-- MySQL 8.0 数据库优化脚本
-- 创建索引和优化配置

USE recruitment_db;

-- 1. 为全文搜索创建索引
-- 注意：需要在表创建后运行
ALTER TABLE applications ADD FULLTEXT(introduction, skills, experience, motivation);

-- 2. 为常用查询字段创建索引
CREATE INDEX idx_applications_status ON applications(status);
CREATE INDEX idx_applications_created_at ON applications(createdAt);
CREATE INDEX idx_applications_student_id ON applications(studentId);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_created_at ON users(createdAt);

CREATE INDEX idx_interviews_scheduled_at ON interviews(scheduledAt);
CREATE INDEX idx_interviews_result ON interviews(result);
CREATE INDEX idx_interviews_is_completed ON interviews(isCompleted);

-- 3. 为 JSON 字段创建虚拟列和索引（MySQL 8.0 特性）
ALTER TABLE interviews 
ADD COLUMN overall_score INT GENERATED ALWAYS AS (JSON_EXTRACT(evaluationScores, '$.overall')) VIRTUAL,
ADD INDEX idx_overall_score (overall_score);

ALTER TABLE interviews 
ADD COLUMN technical_score INT GENERATED ALWAYS AS (JSON_EXTRACT(evaluationScores, '$.technical')) VIRTUAL,
ADD INDEX idx_technical_score (technical_score);

-- 4. 复合索引优化
CREATE INDEX idx_applications_status_created ON applications(status, createdAt);
CREATE INDEX idx_interviews_completed_result ON interviews(isCompleted, result);

-- 5. 外键索引（如果使用外键约束）
CREATE INDEX idx_applications_user_id ON applications(userId);
CREATE INDEX idx_interviews_application_id ON interviews(applicationId);
CREATE INDEX idx_interviews_room_id ON interviews(roomId);

-- 6. 查看索引使用情况的视图
CREATE VIEW v_index_usage AS
SELECT 
    TABLE_SCHEMA,
    TABLE_NAME,
    INDEX_NAME,
    COLUMN_NAME,
    CARDINALITY,
    INDEX_TYPE
FROM information_schema.STATISTICS 
WHERE TABLE_SCHEMA = 'recruitment_db'
ORDER BY TABLE_NAME, INDEX_NAME;

-- 7. 性能监控视图
CREATE VIEW v_slow_queries AS
SELECT 
    sql_text,
    exec_count,
    avg_timer_wait/1000000000 as avg_time_seconds,
    sum_timer_wait/1000000000 as total_time_seconds
FROM performance_schema.events_statements_summary_by_digest
WHERE schema_name = 'recruitment_db'
ORDER BY avg_timer_wait DESC
LIMIT 10;

-- 8. 优化表（整理碎片）
OPTIMIZE TABLE users;
OPTIMIZE TABLE applications;
OPTIMIZE TABLE interviews;
OPTIMIZE TABLE interview_rooms;