# 📖 使用指南

## 🚀 部署和管理

### 统一部署命令

```bash
./deploy.sh install     # 首次部署
./deploy.sh clean       # 完整重新部署（推荐）
./deploy.sh update      # 更新代码
./deploy.sh restart     # 重启服务
./deploy.sh status      # 查看状态
./deploy.sh logs        # 查看日志
./deploy.sh stop        # 停止服务
./deploy.sh help        # 显示帮助
```

### 推荐的使用方式

**首次部署：**
```bash
git clone <repository-url> code-academy-recruitment
cd code-academy-recruitment
cp .env.example .env
nano .env  # 配置必要参数
./deploy.sh install
```

**代码更新或问题修复：**
```bash
git pull  # 如果是 git 仓库
./deploy.sh clean  # 完整重新部署
```

**日常管理：**
```bash
./deploy.sh status  # 查看运行状态
./deploy.sh logs    # 查看服务日志
make health        # 健康检查
make backup        # 备份数据
```

## 🎯 新功能使用

### 📧 邮箱验证码注册

1. **访问注册页面**: http://localhost:43000/register
2. **三步骤流程**:
   - 输入校内邮箱 → 发送验证码
   - 输入6位验证码 → 验证邮箱
   - 填写姓名密码 → 完成注册

### 📝 增强申请表单

1. **访问申请页面**: http://localhost:43000/applications/new
2. **新增字段**:
   - 个人照片上传
   - 一卡通照片上传
   - 项目经验附件上传
   - 年级特定信息收集

### ⚙️ 管理员配置

1. **访问配置页面**: http://localhost:43000/admin/config
2. **可配置项目**:
   - 大一/大二纳新开关
   - 申请开始和截止时间
   - 每人最大申请数量

## 📁 项目文件结构

```
code-academy-recruitment/
├── deploy.sh                    # 统一部署脚本
├── test-email-verification.sh   # 邮箱功能测试
├── test-new-features.sh         # 新功能测试
├── Makefile                     # Make 命令支持
├── docker-compose.yml           # 主配置
├── docker-compose.arm.yml       # ARM 配置
├── .env.example                 # 配置模板
├── backend/                     # 后端代码
├── frontend/                    # 前端代码
├── docker/                      # Docker 配置
└── 文档文件...
```

## 🔧 配置要求

### 必须配置的环境变量

```bash
# 数据库配置
DB_PASSWORD=your_strong_password
DB_ROOT_PASSWORD=your_root_password
REDIS_PASSWORD=your_redis_password

# 安全配置
JWT_SECRET=your_32_character_jwt_secret

# 邮箱配置（用于验证码）
EMAIL_HOST=smtp.your-domain.com
EMAIL_USER=noreply@your-domain.com
EMAIL_PASS=your_email_password
EMAIL_FROM=代码书院 <noreply@your-domain.com>

# 邮箱域名限制
ALLOWED_EMAIL_DOMAIN=@stu.your-university.edu.cn

# 管理员账号
ADMIN_EMAIL=admin@your-domain.com
ADMIN_PASSWORD=your_admin_password
```

## 🌐 访问地址

- **前端界面**: http://localhost:43000
- **后端 API**: http://localhost:45000
- **管理员后台**: http://localhost:43000/admin
- **系统配置**: http://localhost:43000/admin/config

## 📱 用户使用流程

### 学生用户
1. **注册账号**: 邮箱验证码 → 填写信息 → 完成注册
2. **提交申请**: 基本信息 → 上传照片 → 年级信息 → 项目经验 → 提交
3. **查看状态**: 申请列表 → 查看审核状态 → 面试安排
4. **接收通知**: 邮件通知面试时间和结果

### 管理员用户
1. **系统配置**: 设置纳新开关 → 配置时间限制
2. **申请管理**: 查看申请 → 审核材料 → 更新状态
3. **面试管理**: 安排面试 → 记录评分 → 发送结果

## 🆘 故障排除

### 服务异常
```bash
./deploy.sh status      # 查看状态
./deploy.sh logs        # 查看日志
./deploy.sh clean       # 完整重建
```

### 功能测试
```bash
./test-new-features.sh  # 测试所有新功能
make health            # 健康检查
```

### 数据问题
```bash
make backup            # 先备份数据
./deploy.sh clean      # 重新部署
```

## 📞 技术支持

**遇到问题时的处理顺序：**

1. **查看状态**: `./deploy.sh status`
2. **查看日志**: `./deploy.sh logs`
3. **完整重建**: `./deploy.sh clean`
4. **测试功能**: `./test-new-features.sh`

**一键解决大部分问题：**
```bash
./deploy.sh clean
```

---

**记住**：`./deploy.sh clean` 是万能命令，适用于所有更新和问题修复！