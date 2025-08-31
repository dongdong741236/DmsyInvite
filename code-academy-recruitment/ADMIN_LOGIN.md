# 👨‍💼 管理员登录指南

## 🚨 当前问题

从日志看，您尝试用 `admin@dmsy.me` 登录，但系统找不到该用户。

## 🔍 管理员账号配置

管理员账号由 `.env` 文件中的配置决定：

```bash
ADMIN_EMAIL=your_admin_email
ADMIN_PASSWORD=your_admin_password
```

## 📋 检查当前管理员配置

**请在您的服务器上运行：**

```bash
# 查看当前管理员配置
grep -E "ADMIN_EMAIL|ADMIN_PASSWORD" .env

# 查看后端日志中的管理员信息
docker logs recruitment-backend | grep "管理员"
```

## ✅ 修复管理员登录

### 方案1: 修改 .env 文件使用您的邮箱

```bash
# 编辑 .env 文件
nano .env

# 设置管理员邮箱为您的邮箱
ADMIN_EMAIL=admin@dmsy.me
ADMIN_PASSWORD=your_admin_password
```

### 方案2: 使用系统默认管理员

如果 `.env` 文件中没有设置 `ADMIN_EMAIL`，系统会创建默认管理员：
- **邮箱**: `admin@codeacademy.edu.cn`
- **密码**: `admin123456`

## 🚀 应用配置更改

### 重启后端应用新配置

```bash
# 重启后端容器
docker compose restart backend

# 查看启动日志，确认管理员用户信息
docker logs recruitment-backend | grep -A 5 "创建默认管理员用户"
```

### 预期的日志输出

```
=== 创建默认管理员用户 ===
管理员邮箱: admin@dmsy.me
管理员密码: your_admin_password
✅ 默认管理员用户创建成功
```

或

```
✅ 管理员用户已存在
管理员邮箱: admin@dmsy.me
管理员角色: admin
```

## 🔑 管理员登录步骤

1. **访问登录页面**: http://localhost:43000/login
2. **输入管理员邮箱**: 查看日志中显示的管理员邮箱
3. **输入管理员密码**: 查看日志中显示的管理员密码
4. **登录成功后**: 自动跳转到管理员后台

## 🎯 管理员功能

登录成功后可以访问：
- **管理后台**: http://localhost:43000/admin
- **系统配置**: http://localhost:43000/admin/config
- **申请管理**: 查看和审核申请
- **面试管理**: 安排面试时间

## 📞 如果仍然无法登录

### 检查用户是否存在

```bash
# 进入 MySQL 检查用户表
docker exec recruitment-mysql mysql -u root -p -e "
USE recruitment_db;
SELECT email, name, role, isEmailVerified FROM users WHERE role='admin';
"
```

### 重新创建管理员用户

```bash
# 删除现有管理员（如果存在）
docker exec recruitment-mysql mysql -u root -p -e "
USE recruitment_db;
DELETE FROM users WHERE email='admin@dmsy.me';
"

# 重启后端重新创建
docker compose restart backend
```

---

**立即执行：**
```bash
# 1. 设置管理员邮箱
echo "ADMIN_EMAIL=admin@dmsy.me" >> .env
echo "ADMIN_PASSWORD=admin123456" >> .env

# 2. 重启后端
docker compose restart backend

# 3. 查看管理员信息
docker logs recruitment-backend | grep "管理员"
```