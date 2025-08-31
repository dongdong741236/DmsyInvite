-- MySQL 数据库初始化脚本
-- 设置字符集和时区

-- 创建数据库（如果不存在）
CREATE DATABASE IF NOT EXISTS recruitment_db
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

-- 使用数据库
USE recruitment_db;

-- 设置时区
SET time_zone = '+08:00';

-- 创建用户（如果不存在）
-- 注意：在 Docker 环境中，用户已经通过环境变量创建

-- 优化设置
SET GLOBAL innodb_buffer_pool_size = 268435456; -- 256MB
SET GLOBAL max_connections = 200;
SET GLOBAL query_cache_size = 67108864; -- 64MB
SET GLOBAL query_cache_type = 1;