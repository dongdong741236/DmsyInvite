-- MySQL 8.0 数据库初始化脚本
-- 设置字符集和时区

-- 创建数据库（如果不存在）
CREATE DATABASE IF NOT EXISTS recruitment_db
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

-- 使用数据库
USE recruitment_db;

-- 设置时区
SET time_zone = '+08:00';

-- MySQL 8.0 优化设置
SET GLOBAL innodb_buffer_pool_size = 268435456; -- 256MB
SET GLOBAL max_connections = 200;
SET GLOBAL innodb_log_file_size = 67108864; -- 64MB
SET GLOBAL innodb_flush_log_at_trx_commit = 2;
SET GLOBAL innodb_file_per_table = 1;

-- 启用性能监控
SET GLOBAL performance_schema = ON;

-- 设置 SQL 模式（更严格的数据验证）
SET GLOBAL sql_mode = 'STRICT_TRANS_TABLES,NO_ZERO_DATE,NO_ZERO_IN_DATE,ERROR_FOR_DIVISION_BY_ZERO';

-- 修复用户权限问题：确保应用用户可以从容器网络连接
-- 删除可能存在的限制性用户（如果存在）
DROP USER IF EXISTS 'recruitment_user'@'localhost';
DROP USER IF EXISTS 'recruitment_user'@'127.0.0.1';

-- 创建允许从任何 IP 连接的用户
-- 注意：这里的密码需要与 .env 文件中的 DB_PASSWORD 一致
CREATE USER IF NOT EXISTS 'recruitment_user'@'%' IDENTIFIED BY 'your_secure_password';

-- 赋予完整的数据库权限
GRANT ALL PRIVILEGES ON recruitment_db.* TO 'recruitment_user'@'%';

-- 刷新权限
FLUSH PRIVILEGES;

-- 创建用于性能监控的存储过程
DELIMITER $$

CREATE PROCEDURE GetDatabaseStats()
BEGIN
    SELECT 
        'Tables' as metric,
        COUNT(*) as value
    FROM information_schema.tables 
    WHERE table_schema = 'recruitment_db'
    
    UNION ALL
    
    SELECT 
        'Total Size (MB)' as metric,
        ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) as value
    FROM information_schema.tables 
    WHERE table_schema = 'recruitment_db';
END$$

DELIMITER ;