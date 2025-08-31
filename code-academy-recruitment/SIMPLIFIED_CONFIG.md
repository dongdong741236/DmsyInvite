# 🔧 简化配置说明

## ✅ 使用 MySQL Root 用户

为了避免权限问题，系统现在直接使用 MySQL root 用户连接数据库。

### 配置变更

#### 后端数据库配置
```typescript
// backend/src/config/database.ts
username: process.env.DB_USER || 'root',           // 使用 root 用户
password: process.env.DB_PASSWORD || 'root_password',  // 使用 root 密码
```

#### 环境变量配置
```bash
# .env 文件配置
DB_USER=root
DB_PASSWORD=root_password
DB_ROOT_PASSWORD=root_password  # 两个密码相同
```

#### Docker Compose 配置
```yaml
# 只需要配置 root 密码和数据库名
environment:
  MYSQL_DATABASE: recruitment_db
  MYSQL_ROOT_PASSWORD: root_password
```

### 优势

1. **简单可靠** - 无需创建额外用户
2. **权限充足** - root 用户拥有所有权限
3. **连接稳定** - root 可以从任何 IP 连接
4. **配置简化** - 减少了配置复杂性

### 安全说明

- 数据库只在容器网络内访问
- 外部无法直接连接数据库
- 仍然需要正确的密码
- 适用于内部系统和开发环境

## 🚀 现在可以正常部署

```bash
./deploy.sh clean
```

应该能看到：
- ✅ 后端容器正常运行
- ✅ 数据库连接成功
- ✅ API 正常响应

---

**配置要点**：确保 .env 文件中 `DB_PASSWORD` 和 `DB_ROOT_PASSWORD` 设置为相同的值。