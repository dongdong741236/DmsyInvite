# MySQL 数据库迁移指南

## 概述

系统已从 PostgreSQL 迁移到 MySQL 8.0，本文档说明了所有相关的更改。

## 主要变更

### 1. 依赖包更改

- 移除：`pg` (PostgreSQL驱动)
- 新增：`mysql2` (MySQL驱动)

### 2. 数据库配置更改

```typescript
// 旧配置 (PostgreSQL)
export const AppDataSource = new DataSource({
  type: 'postgres',
  port: 5432,
  // ...
});

// 新配置 (MySQL)
export const AppDataSource = new DataSource({
  type: 'mysql',
  port: 3306,
  charset: 'utf8mb4',
  timezone: '+08:00',
  // ...
});
```

### 3. Docker配置更改

- 容器名：`recruitment-postgres` → `recruitment-mysql`
- 镜像：`postgres:15-alpine` → `mysql:8.0`
- 端口：`5432` → `3306`
- 数据卷：`postgres_data` → `mysql_data`

### 4. 环境变量更改

```bash
# 旧配置
DB_HOST=postgres
DB_PORT=5432

# 新配置
DB_HOST=mysql
DB_PORT=3306
DB_ROOT_PASSWORD=root_password  # 新增
```

## 数据库特性

### MySQL 8.0 优势

1. **性能提升**
   - 改进的查询优化器
   - 更好的索引性能
   - 支持并行查询

2. **字符集支持**
   - 默认 utf8mb4 字符集
   - 完整的 Unicode 支持
   - 支持 Emoji 存储

3. **JSON 支持**
   - 原生 JSON 数据类型
   - JSON 函数和操作符
   - JSON 索引支持

### 配置优化

系统已配置以下 MySQL 优化：

```sql
-- 字符集配置
character-set-server=utf8mb4
collation-server=utf8mb4_unicode_ci

-- 性能优化
innodb_buffer_pool_size=256M
max_connections=200
query_cache_size=64M
```

## 备份和恢复

### 备份数据库

```bash
# 使用 Make 命令
make backup

# 或手动执行
docker exec recruitment-mysql mysqldump -u recruitment_user -p recruitment_db > backup.sql
```

### 恢复数据库

```bash
# 使用 Make 命令
make restore

# 或手动执行
docker exec -i recruitment-mysql mysql -u recruitment_user -p recruitment_db < backup.sql
```

## 从 PostgreSQL 迁移数据

如果您有现有的 PostgreSQL 数据需要迁移，可以使用以下方法：

### 1. 使用数据迁移工具

推荐使用 `pgloader` 工具：

```bash
# 安装 pgloader
apt-get install pgloader

# 执行迁移
pgloader postgresql://user:password@localhost/old_db mysql://user:password@localhost/new_db
```

### 2. 手动迁移

1. 从 PostgreSQL 导出数据：
```bash
pg_dump -U user -d database --data-only --inserts > data.sql
```

2. 转换 SQL 语法（主要是日期和布尔值格式）

3. 导入到 MySQL：
```bash
mysql -u user -p database < converted_data.sql
```

## 注意事项

### 1. SQL 语法差异

- **布尔值**: PostgreSQL 的 `TRUE/FALSE` → MySQL 的 `1/0`
- **自增ID**: PostgreSQL 的 `SERIAL` → MySQL 的 `AUTO_INCREMENT`
- **时间戳**: 注意时区处理差异

### 2. 数据类型映射

| PostgreSQL | MySQL |
|------------|-------|
| SERIAL | INT AUTO_INCREMENT |
| BOOLEAN | TINYINT(1) |
| TEXT | LONGTEXT |
| JSONB | JSON |
| UUID | VARCHAR(36) |

### 3. 字符集问题

确保所有文本数据使用 UTF-8 编码，避免字符集不匹配问题。

## 故障排除

### 常见问题

1. **连接问题**
   ```bash
   # 检查 MySQL 服务状态
   docker exec recruitment-mysql mysqladmin ping
   ```

2. **字符集问题**
   ```sql
   -- 检查字符集设置
   SHOW VARIABLES LIKE 'character_set%';
   ```

3. **权限问题**
   ```sql
   -- 检查用户权限
   SHOW GRANTS FOR 'recruitment_user'@'%';
   ```

## 性能监控

### 监控命令

```bash
# 查看 MySQL 状态
docker exec recruitment-mysql mysqladmin status

# 查看进程列表
docker exec recruitment-mysql mysqladmin processlist

# 查看变量
docker exec recruitment-mysql mysql -e "SHOW STATUS;"
```

### 慢查询分析

慢查询日志位置：`/var/log/mysql/slow.log`

```bash
# 查看慢查询日志
docker exec recruitment-mysql tail -f /var/log/mysql/slow.log
```

## 总结

MySQL 迁移已完成，系统现在使用 MySQL 8.0 作为主数据库。所有功能保持不变，但获得了更好的性能和稳定性。

如有问题，请参考本文档或查看系统日志进行故障排除。