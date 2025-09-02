# 业务流程详解

## 1. 系统架构流程

```mermaid
graph TB
    subgraph "用户层 User Layer"
        U1[申请者]
        U2[面试官]
        U3[管理员]
    end
    
    subgraph "前端应用 Frontend"
        F1[React SPA]
        F2[路由守卫]
        F3[状态管理]
    end
    
    subgraph "API网关 API Gateway"
        G1[Nginx反向代理]
        G2[负载均衡]
        G3[静态资源服务]
    end
    
    subgraph "后端服务 Backend Services"
        B1[Express Server]
        B2[JWT认证中间件]
        B3[权限验证中间件]
        B4[业务逻辑层]
        B5[数据访问层]
    end
    
    subgraph "数据存储 Data Storage"
        D1[MySQL数据库]
        D2[文件存储]
        D3[缓存层]
    end
    
    subgraph "外部服务 External Services"
        E1[SMTP邮件服务]
        E2[验证码服务]
    end
    
    U1 & U2 & U3 --> F1
    F1 --> F2
    F2 --> F3
    F3 --> G1
    G1 --> G2
    G2 --> B1
    B1 --> B2
    B2 --> B3
    B3 --> B4
    B4 --> B5
    B5 --> D1
    B4 --> D2
    B4 --> E1
    G1 --> G3
    G3 --> D2
```

## 2. 用户注册与验证流程

```mermaid
sequenceDiagram
    participant U as 用户
    participant F as 前端
    participant B as 后端
    participant DB as 数据库
    participant E as 邮件服务
    
    U->>F: 填写注册信息
    F->>F: 表单验证
    F->>B: POST /auth/register
    B->>DB: 检查邮箱是否存在
    DB-->>B: 返回结果
    
    alt 邮箱已存在
        B-->>F: 409 Conflict
        F-->>U: 提示邮箱已注册
    else 邮箱可用
        B->>DB: 创建用户记录
        B->>B: 生成验证Token
        B->>E: 发送验证邮件
        E-->>U: 收到验证邮件
        B-->>F: 201 Created
        F-->>U: 注册成功，请验证邮箱
        
        U->>E: 点击验证链接
        E->>B: GET /auth/verify-email?token=xxx
        B->>DB: 验证Token并更新状态
        B-->>U: 重定向到登录页
    end
```

## 3. 申请提交流程

```mermaid
flowchart TD
    Start([开始申请]) --> CheckAuth{是否已登录?}
    CheckAuth -->|否| RedirectLogin[跳转登录]
    CheckAuth -->|是| CheckVerified{邮箱已验证?}
    
    CheckVerified -->|否| ShowVerifyPrompt[提示验证邮箱]
    CheckVerified -->|是| CheckOpen{申请是否开放?}
    
    CheckOpen -->|否| ShowClosed[显示未开放提示]
    CheckOpen -->|是| CheckGrade{检查年级配置}
    
    CheckGrade -->|大一未开放| ShowFreshmanClosed[大一申请未开放]
    CheckGrade -->|大二未开放| ShowSophomoreClosed[大二申请未开放]
    CheckGrade -->|开放| CheckExisting{已有申请?}
    
    CheckExisting -->|是| CheckLimit{达到上限?}
    CheckExisting -->|否| ShowForm[显示申请表单]
    
    CheckLimit -->|是| ShowLimitReached[提示达到申请上限]
    CheckLimit -->|否| ShowForm
    
    ShowForm --> FillBasicInfo[填写基本信息]
    FillBasicInfo --> FillGradeSpecific{年级特定信息}
    
    FillGradeSpecific -->|大一| FillFreshmanInfo[填写高考成绩等]
    FillGradeSpecific -->|大二| FillSophomoreInfo[填写GPA、编程成绩等]
    
    FillFreshmanInfo --> UploadFiles[上传证明文件]
    FillSophomoreInfo --> UploadFiles
    
    UploadFiles --> UploadPhoto[上传个人照片]
    UploadPhoto --> UploadStudentCard[上传学生证]
    UploadStudentCard --> UploadAttachments[上传项目佐证]
    
    UploadAttachments --> ValidateForm{表单验证}
    ValidateForm -->|失败| ShowErrors[显示错误信息]
    ShowErrors --> ShowForm
    
    ValidateForm -->|成功| SubmitApplication[提交申请]
    SubmitApplication --> SaveToDB[(保存到数据库)]
    SaveToDB --> SendConfirmEmail[发送确认邮件]
    SendConfirmEmail --> ShowSuccess[显示成功提示]
    ShowSuccess --> End([申请完成])
    
    RedirectLogin --> End
    ShowVerifyPrompt --> End
    ShowClosed --> End
    ShowFreshmanClosed --> End
    ShowSophomoreClosed --> End
    ShowLimitReached --> End
```

## 4. 审核与面试安排流程

```mermaid
flowchart TD
    Start([新申请提交]) --> NotifyAdmin[通知管理员]
    NotifyAdmin --> AdminReview{管理员审核}
    
    AdminReview -->|查看材料| ViewApplication[查看申请详情]
    ViewApplication --> CheckQuality{材料质量}
    
    CheckQuality -->|不合格| Reject[拒绝申请]
    CheckQuality -->|合格| Approve[通过初审]
    
    Reject --> UpdateStatus1[更新状态为rejected]
    UpdateStatus1 --> SendRejectEmail[发送拒绝邮件]
    SendRejectEmail --> End1([流程结束])
    
    Approve --> UpdateStatus2[更新状态为approved]
    UpdateStatus2 --> SelectRoom[选择面试教室]
    SelectRoom --> CheckInterviewers{教室有面试官?}
    
    CheckInterviewers -->|否| AssignInterviewers[分配面试官]
    CheckInterviewers -->|是| SelectTime[选择面试时间]
    AssignInterviewers --> SelectTime
    
    SelectTime --> CheckConflict{时间冲突?}
    CheckConflict -->|是| SelectTime
    CheckConflict -->|否| CreateInterview[创建面试记录]
    
    CreateInterview --> UpdateStatus3[更新状态为interview_scheduled]
    UpdateStatus3 --> SendInterviewEmail[发送面试通知邮件]
    SendInterviewEmail --> NotifyInterviewers[通知面试官]
    NotifyInterviewers --> End2([安排完成])
```

## 5. 面试执行流程

```mermaid
sequenceDiagram
    participant A as 申请者
    participant I as 面试官
    participant S as 系统
    participant DB as 数据库
    
    Note over A,I: 面试开始前
    A->>S: 查看面试安排
    S->>DB: 获取面试信息
    DB-->>S: 返回时间地点
    S-->>A: 显示面试详情
    
    I->>S: 登录面试官账号
    S->>DB: 获取今日面试
    DB-->>S: 返回面试列表
    S-->>I: 显示待面试学生
    
    Note over A,I: 面试进行中
    I->>S: 进入面试面板
    S->>DB: 加载申请者资料
    DB-->>S: 返回完整信息
    S-->>I: 显示申请者信息
    
    I->>I: 查看简历材料
    I->>I: 查看项目佐证
    I->>A: 提问面试问题
    A-->>I: 回答问题
    
    I->>S: 记录问题答案
    S->>DB: 保存答案
    I->>S: 评分(技术/沟通/团队/动机)
    S->>DB: 保存评分
    
    Note over A,I: 面试结束后
    I->>S: 提交综合评价
    S->>DB: 更新面试结果
    DB-->>S: 确认保存
    S->>S: 更新申请状态为interviewed
    S-->>I: 提示评价已保存
    
    Note over A: 等待结果通知
    A->>S: 查看申请状态
    S-->>A: 显示"已面试，等待结果"
```

## 6. 结果通知流程

```mermaid
flowchart TD
    Start([面试完成]) --> AdminReview[管理员查看结果]
    AdminReview --> CheckScores{查看评分}
    
    CheckScores --> MakeDecision{最终决定}
    MakeDecision -->|录取| SetPassed[设置为通过]
    MakeDecision -->|不录取| SetFailed[设置为未通过]
    MakeDecision -->|需讨论| Pending[保持待定]
    
    Pending --> Discussion[团队讨论]
    Discussion --> MakeDecision
    
    SetPassed --> SelectTemplate1[选择录取通知模板]
    SetFailed --> SelectTemplate2[选择拒绝通知模板]
    
    SelectTemplate1 --> CustomizeContent1[自定义通知内容]
    SelectTemplate2 --> CustomizeContent2[自定义通知内容]
    
    CustomizeContent1 --> SendNotification1[发送录取通知]
    CustomizeContent2 --> SendNotification2[发送拒绝通知]
    
    SendNotification1 --> UpdateNotificationStatus1[更新notificationSent=true]
    SendNotification2 --> UpdateNotificationStatus2[更新notificationSent=true]
    
    UpdateNotificationStatus1 --> UpdateApplicationStatus1[更新申请状态为accepted]
    UpdateNotificationStatus2 --> UpdateApplicationStatus2[更新申请状态为rejected]
    
    UpdateApplicationStatus1 --> NotifyApplicant1[申请者收到邮件]
    UpdateApplicationStatus2 --> NotifyApplicant2[申请者收到邮件]
    
    NotifyApplicant1 --> ViewResult1[申请者查看结果]
    NotifyApplicant2 --> ViewResult2[申请者查看结果]
    
    ViewResult1 --> End([流程结束])
    ViewResult2 --> End
```

## 7. 权限控制流程

```mermaid
flowchart TD
    Request([HTTP请求]) --> ExtractToken[提取JWT Token]
    ExtractToken --> HasToken{是否有Token?}
    
    HasToken -->|否| CheckPublic{是公开接口?}
    HasToken -->|是| VerifyToken[验证Token]
    
    CheckPublic -->|是| AllowAccess[允许访问]
    CheckPublic -->|否| Return401[返回401未认证]
    
    VerifyToken --> TokenValid{Token有效?}
    TokenValid -->|否| Return401
    TokenValid -->|是| ExtractUser[提取用户信息]
    
    ExtractUser --> CheckRole{检查角色权限}
    
    CheckRole -->|管理员| AdminCheck{需要管理员权限?}
    AdminCheck -->|是| AllowAccess
    AdminCheck -->|否| CheckResource[检查资源权限]
    
    CheckRole -->|面试官| InterviewerCheck{需要面试官权限?}
    InterviewerCheck -->|是| CheckInterviewOwnership{是否参与该面试?}
    InterviewerCheck -->|否| CheckResource
    
    CheckRole -->|普通用户| UserCheck{需要特殊权限?}
    UserCheck -->|是| Return403[返回403无权限]
    UserCheck -->|否| CheckResource
    
    CheckInterviewOwnership -->|是| AllowAccess
    CheckInterviewOwnership -->|否| Return403
    
    CheckResource --> IsOwner{是资源所有者?}
    IsOwner -->|是| AllowAccess
    IsOwner -->|否| Return403
    
    AllowAccess --> ProcessRequest[处理请求]
    ProcessRequest --> ReturnResponse[返回响应]
    
    Return401 --> End([结束])
    Return403 --> End
    ReturnResponse --> End
```

## 8. 数据安全流程

```mermaid
flowchart TD
    Start([数据请求]) --> CheckSensitive{包含敏感数据?}
    
    CheckSensitive -->|否| ReturnData[直接返回数据]
    CheckSensitive -->|是| CheckType{数据类型}
    
    CheckType -->|面试结果| CheckNotificationSent{已发送通知?}
    CheckType -->|个人信息| CheckOwnership{检查所有权}
    CheckType -->|系统配置| CheckAdmin{是管理员?}
    
    CheckNotificationSent -->|是| ReturnData
    CheckNotificationSent -->|否| FilterResult[过滤结果字段]
    
    CheckOwnership -->|是所有者| ReturnData
    CheckOwnership -->|是管理员| ReturnData
    CheckOwnership -->|是相关面试官| ReturnPartial[返回部分数据]
    CheckOwnership -->|其他| ReturnEmpty[返回空或错误]
    
    CheckAdmin -->|是| ReturnData
    CheckAdmin -->|否| ReturnEmpty
    
    FilterResult --> RemoveFields[移除敏感字段]
    RemoveFields --> ReturnFiltered[返回过滤后数据]
    
    ReturnData --> End([结束])
    ReturnPartial --> End
    ReturnEmpty --> End
    ReturnFiltered --> End
```

## 9. 文件上传流程

```mermaid
sequenceDiagram
    participant U as 用户
    participant F as 前端
    participant B as 后端
    participant FS as 文件系统
    participant DB as 数据库
    
    U->>F: 选择文件
    F->>F: 检查文件类型
    F->>F: 检查文件大小
    
    alt 文件不合规
        F-->>U: 显示错误提示
    else 文件合规
        F->>B: POST /applications/upload
        Note right of B: multipart/form-data
        
        B->>B: 验证文件类型
        B->>B: 验证文件大小
        B->>B: 生成唯一文件名
        B->>B: 确定存储路径
        
        B->>FS: 保存文件
        FS-->>B: 返回文件路径
        
        B->>DB: 记录文件信息
        DB-->>B: 确认保存
        
        B-->>F: 返回文件路径
        F->>F: 更新表单字段
        F-->>U: 显示上传成功
    end
    
    Note over U,DB: 文件访问时
    U->>F: 请求查看文件
    F->>B: GET /uploads/path/file
    B->>B: 验证用户权限
    
    alt 有权限
        B->>FS: 读取文件
        FS-->>B: 返回文件内容
        B-->>F: 返回文件
        F-->>U: 显示文件
    else 无权限
        B-->>F: 403 Forbidden
        F-->>U: 显示无权限
    end
```

## 10. 年度管理流程

```mermaid
flowchart TD
    Start([新学期开始]) --> CreateYear[创建新年度]
    CreateYear --> ConfigYear[配置年度参数]
    
    ConfigYear --> SetDates[设置起止日期]
    SetDates --> SetQuota[设置招新名额]
    SetQuota --> SetRequirements[设置招新要求]
    
    SetRequirements --> ActivateYear{激活年度?}
    ActivateYear -->|是| SetActive[设为当前年度]
    ActivateYear -->|否| SaveDraft[保存为草稿]
    
    SetActive --> DeactivateOld[停用旧年度]
    DeactivateOld --> NotifyUsers[通知用户]
    
    NotifyUsers --> OpenApplication[开放申请]
    SaveDraft --> WaitActivation[等待激活]
    
    OpenApplication --> MonitorProgress[监控进度]
    MonitorProgress --> CheckDeadline{到达截止日期?}
    
    CheckDeadline -->|否| MonitorProgress
    CheckDeadline -->|是| CloseApplication[关闭申请]
    
    CloseApplication --> StartReview[开始审核阶段]
    StartReview --> ConductInterviews[进行面试]
    ConductInterviews --> PublishResults[发布结果]
    
    PublishResults --> YearEnd[年度结束]
    YearEnd --> ArchiveData[归档数据]
    ArchiveData --> GenerateReport[生成报告]
    GenerateReport --> End([完成])
    
    WaitActivation --> ActivateYear
```

## 流程说明

### 关键节点说明

1. **注册验证**：确保用户邮箱真实有效
2. **申请审核**：多级审核确保质量
3. **面试安排**：自动分配和冲突检测
4. **权限控制**：基于角色的细粒度控制
5. **数据安全**：敏感信息分级保护

### 状态流转

申请状态流转：
- `pending` → `reviewing` → `approved` → `interview_scheduled` → `interviewed` → `accepted/rejected`

面试状态流转：
- `scheduled` → `in_progress` → `completed` → `notified`

### 并发控制

- 使用数据库事务确保数据一致性
- 使用乐观锁防止并发修改
- 使用队列处理邮件发送

### 异常处理

- 所有流程都有异常处理分支
- 关键操作有重试机制
- 错误日志记录和告警

---

*最后更新: 2024年1月*