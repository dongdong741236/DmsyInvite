-- MySQL 8.0 数据库初始化脚本（简化版）

-- 创建数据库（如果不存在）
CREATE DATABASE IF NOT EXISTS recruitment_db
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

-- 使用数据库
USE recruitment_db;

-- 设置会话时区
SET time_zone = '+08:00';