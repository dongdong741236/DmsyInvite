# 📧 邮件配置修复指南

## 🚨 当前问题

**错误**: `Connection timeout` 在连接 `smtp.vip.163.com:25`

**原因**: 端口 25 经常被云服务商阻止，163 邮箱需要特殊配置

## ✅ 163 邮箱正确配置

### 修改 .env 文件

```bash
# 163 VIP 邮箱正确配置
EMAIL_HOST=smtp.vip.163.com
EMAIL_PORT=587              # 改为 587 端口
EMAIL_SECURE=false          # 587 端口使用 STARTTLS
EMAIL_USER=dong.cust@vip.163.com
EMAIL_PASS=YKR4Pt6         # 确保是应用密码，不是登录密码
EMAIL_FROM=代码书院 <dong.cust@vip.163.com>
```

### 163 邮箱设置步骤

1. **登录 163 邮箱**
2. **开启 SMTP 服务**：
   - 进入"设置" → "POP3/SMTP/IMAP"
   - 开启"SMTP服务"
3. **获取应用密码**：
   - 设置"客户端授权密码"
   - 这个密码用于 `EMAIL_PASS`，不是登录密码

### 其他邮箱服务商配置

#### QQ 邮箱
```bash
EMAIL_HOST=smtp.qq.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your_qq@qq.com
EMAIL_PASS=app_password  # QQ 邮箱应用密码
```

#### Gmail
```bash
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=app_password  # Gmail 应用密码
```

#### 企业邮箱（腾讯）
```bash
EMAIL_HOST=smtp.exmail.qq.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your_email@your-domain.com
EMAIL_PASS=your_password
```

## 🔧 立即修复步骤

### 步骤1: 修改邮件配置

```bash
# 编辑 .env 文件
nano .env

# 修改邮件配置为：
EMAIL_HOST=smtp.vip.163.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=dong.cust@vip.163.com
EMAIL_PASS=YKR4Pt6
EMAIL_FROM=代码书院 <dong.cust@vip.163.com>
```

### 步骤2: 重启后端服务

```bash
# 重启后端应用新的邮件配置
docker compose restart backend
```

### 步骤3: 测试邮件发送

```bash
# 查看后端日志
docker logs recruitment-backend -f

# 在前端测试发送验证码
# 观察日志输出
```

## 🔍 调试信息

现在后端会输出详细的邮件调试信息：

```
=== 创建邮件传输器 ===
EMAIL_HOST: smtp.vip.163.com
EMAIL_PORT: 587
EMAIL_USER: dong.cust@vip.163.com

=== 开始发送邮件 ===
收件人: dong@mails.cust.edu.cn
✅ 邮件发送成功: <message-id>
或
❌ 邮件发送失败: [详细错误]
```

## 🆘 如果仍然失败

### 检查网络连接
```bash
# 测试 SMTP 服务器连接
docker exec recruitment-backend nc -zv smtp.vip.163.com 587
```

### 检查防火墙
```bash
# 检查出站端口 587 是否开放
sudo ufw status | grep 587
```

### 使用其他端口
```bash
# 尝试 465 端口（SSL）
EMAIL_PORT=465
EMAIL_SECURE=true
```

## 📞 常见问题

1. **应用密码** - 确保使用邮箱的应用密码，不是登录密码
2. **端口阻止** - 云服务商可能阻止 SMTP 端口
3. **网络限制** - 防火墙或安全组限制

---

**立即修复命令：**
```bash
# 1. 修改 .env 中的 EMAIL_PORT=587
# 2. 重启后端
docker compose restart backend
```