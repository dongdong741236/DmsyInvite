# MySQL 8.0 使用指南

## 为什么选择 MySQL 8.0

MySQL 8.0 是一个成熟、稳定且功能强大的关系型数据库，特别适合我们的纳新系统：

### 主要优势

1. **成熟稳定**
   - 广泛的社区支持
   - 丰富的文档和教程
   - 成熟的生态系统

2. **性能优异**
   - 改进的查询优化器
   - 更好的索引性能
   - 支持并行查询

3. **功能丰富**
   - 原生 JSON 支持
   - 窗口函数
   - CTE（通用表表达式）
   - 全文搜索

4. **易于管理**
   - 直观的管理工具
   - 完善的监控功能
   - 简单的备份恢复

## 系统中的 MySQL 8.0 特性应用

### 1. JSON 数据处理

面试评分使用 JSON 格式存储，MySQL 8.0 提供了强大的 JSON 函数：

```sql
-- 查询技术评分大于80的申请
SELECT * FROM interviews 
WHERE JSON_EXTRACT(evaluationScores, '$.technical') > 80;

-- 统计各项评分的平均值
SELECT 
    AVG(JSON_EXTRACT(evaluationScores, '$.technical')) as avg_technical,
    AVG(JSON_EXTRACT(evaluationScores, '$.communication')) as avg_communication
FROM interviews;
```

### 2. 全文搜索

对申请内容进行全文搜索：

```sql
-- 创建全文索引
ALTER TABLE applications ADD FULLTEXT(introduction, skills, experience, motivation);

-- 搜索包含"编程"的申请
SELECT * FROM applications 
WHERE MATCH(introduction, skills, experience, motivation) 
AGAINST('编程' IN NATURAL LANGUAGE MODE);
```

### 3. 窗口函数

用于统计分析：

```sql
-- 计算每个状态的申请数量和百分比
SELECT 
    status,
    COUNT(*) as count,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM applications
GROUP BY status;
```

### 4. CTE（通用表表达式）

复杂查询的简化：

```sql
WITH monthly_stats AS (
    SELECT 
        DATE_FORMAT(createdAt, '%Y-%m') as month,
        COUNT(*) as count
    FROM applications
    GROUP BY DATE_FORMAT(createdAt, '%Y-%m')
)
SELECT * FROM monthly_stats ORDER BY month DESC;
```

## 性能优化

### 1. 索引策略

系统已配置的关键索引：

```sql
-- 状态索引（用于筛选）
CREATE INDEX idx_applications_status ON applications(status);

-- 时间索引（用于排序和时间范围查询）
CREATE INDEX idx_applications_created_at ON applications(createdAt);

-- JSON 虚拟列索引（MySQL 8.0 特性）
ALTER TABLE interviews 
ADD COLUMN overall_score INT GENERATED ALWAYS AS (JSON_EXTRACT(evaluationScores, '$.overall')) VIRTUAL,
ADD INDEX idx_overall_score (overall_score);
```

### 2. 查询优化

- 使用 `EXPLAIN` 分析查询计划
- 避免全表扫描
- 合理使用 `LIMIT` 分页
- 使用覆盖索引

### 3. 配置优化

关键配置项（已在 `my.cnf` 中设置）：

```ini
# InnoDB 缓冲池大小
innodb_buffer_pool_size=256M

# 连接数
max_connections=200

# 查询缓存
query_cache_size=64M
query_cache_type=1

# 日志配置
slow_query_log=1
long_query_time=2
```

## 监控和维护

### 1. 性能监控

查看慢查询：

```sql
-- 查看最慢的查询
SELECT 
    sql_text,
    exec_count,
    avg_timer_wait/1000000000 as avg_time_seconds
FROM performance_schema.events_statements_summary_by_digest
WHERE schema_name = 'recruitment_db'
ORDER BY avg_timer_wait DESC
LIMIT 10;
```

### 2. 空间使用情况

```sql
-- 查看表大小
SELECT 
    table_name,
    ROUND(((data_length + index_length) / 1024 / 1024), 2) as size_mb
FROM information_schema.tables 
WHERE table_schema = 'recruitment_db'
ORDER BY size_mb DESC;
```

### 3. 定期维护

```bash
# 优化表（整理碎片）
docker exec recruitment-mysql mysql -u root -p -e "
OPTIMIZE TABLE recruitment_db.users;
OPTIMIZE TABLE recruitment_db.applications;
OPTIMIZE TABLE recruitment_db.interviews;
"

# 分析表统计信息
docker exec recruitment-mysql mysql -u root -p -e "
ANALYZE TABLE recruitment_db.applications;
"
```

## 备份策略

### 1. 完整备份

```bash
# 使用 Make 命令
make backup

# 手动备份
docker exec recruitment-mysql mysqldump \
  -u recruitment_user -p \
  --single-transaction \
  --routines \
  --triggers \
  recruitment_db > backup_$(date +%Y%m%d_%H%M%S).sql
```

### 2. 增量备份

启用二进制日志（已在配置中启用）：

```ini
log-bin=mysql-bin
binlog_format=ROW
expire_logs_days=7
```

### 3. 恢复

```bash
# 恢复完整备份
docker exec -i recruitment-mysql mysql \
  -u recruitment_user -p \
  recruitment_db < backup_file.sql
```

## 安全配置

### 1. 用户权限

```sql
-- 创建只读用户（用于报表查询）
CREATE USER 'readonly'@'%' IDENTIFIED BY 'readonly_password';
GRANT SELECT ON recruitment_db.* TO 'readonly'@'%';

-- 创建备份用户
CREATE USER 'backup'@'localhost' IDENTIFIED BY 'backup_password';
GRANT SELECT, LOCK TABLES, SHOW VIEW, EVENT, TRIGGER ON recruitment_db.* TO 'backup'@'localhost';
```

### 2. 连接安全

- 使用强密码
- 限制连接来源
- 启用 SSL（生产环境）
- 定期更新密码

## 故障排除

### 常见问题

1. **连接超时**
   ```bash
   # 检查连接状态
   docker exec recruitment-mysql mysqladmin processlist
   ```

2. **慢查询**
   ```bash
   # 查看慢查询日志
   docker exec recruitment-mysql tail -f /var/log/mysql/slow.log
   ```

3. **锁等待**
   ```sql
   -- 查看锁等待情况
   SELECT * FROM performance_schema.data_locks;
   ```

### 性能调优

1. **查询优化**
   - 使用 `EXPLAIN` 分析
   - 添加合适的索引
   - 重写复杂查询

2. **配置调优**
   - 调整缓冲池大小
   - 优化连接数
   - 调整日志配置

## 总结

MySQL 8.0 为我们的纳新系统提供了：

- ✅ 稳定可靠的数据存储
- ✅ 强大的查询功能
- ✅ 优秀的性能表现
- ✅ 完善的管理工具
- ✅ 丰富的生态支持

通过合理的配置和优化，MySQL 8.0 能够很好地满足系统的需求，为用户提供快速、稳定的服务体验。