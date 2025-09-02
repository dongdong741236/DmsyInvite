import { AppDataSource } from '../config/database';
import { EmailTemplate, EmailTemplateType } from '../models/EmailTemplate';

export class EmailTemplateService {
  private static getRepository() {
    return AppDataSource.getRepository(EmailTemplate);
  }

  // 获取模板
  static async getTemplate(type: EmailTemplateType): Promise<EmailTemplate | null> {
    const repository = this.getRepository();
    return await repository.findOne({
      where: { type, isActive: true },
    });
  }

  // 获取所有模板
  static async getAllTemplates(): Promise<EmailTemplate[]> {
    const repository = this.getRepository();
    return await repository.find({
      order: { type: 'ASC' },
    });
  }

  // 更新模板
  static async updateTemplate(
    type: EmailTemplateType,
    data: Partial<EmailTemplate>
  ): Promise<EmailTemplate> {
    const repository = this.getRepository();
    
    let template = await repository.findOne({ where: { type } });
    
    if (!template) {
      // 创建新模板
      template = repository.create({
        type,
        ...data,
      });
    } else {
      // 更新现有模板
      Object.assign(template, data);
    }

    return await repository.save(template);
  }

  // 渲染模板（替换变量）
  static renderTemplate(template: EmailTemplate, variables: Record<string, any>): {
    subject: string;
    html: string;
  } {
    let subject = template.subject;
    let html = template.htmlContent;

    // 替换变量
    Object.entries(variables).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`;
      subject = subject.replace(new RegExp(placeholder, 'g'), String(value));
      html = html.replace(new RegExp(placeholder, 'g'), String(value));
    });

    return { subject, html };
  }

  // 初始化默认模板
  static async initializeDefaultTemplates(): Promise<void> {
    console.log('开始初始化邮件模板...');

    const defaultTemplates = [
      {
        type: EmailTemplateType.VERIFICATION_CODE,
        name: '邮箱验证码',
        subject: '代码书院 - 邮箱验证码',
        htmlContent: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">邮箱验证码</h2>
            <p>您好！</p>
            <p>您的邮箱验证码是：</p>
            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
              <h1 style="color: #dc2626; font-size: 32px; margin: 0;">{{code}}</h1>
            </div>
            <p>验证码有效期为10分钟，请及时使用。</p>
            <p>如果您没有申请验证码，请忽略此邮件。</p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
            <p style="color: #6b7280; font-size: 14px;">代码书院实验室</p>
          </div>
        `,
        variables: JSON.stringify(['code']),
      },
      {
        type: EmailTemplateType.INTERVIEW_NOTIFICATION,
        name: '面试通知',
        subject: '代码书院实验室 - 面试通知',
        htmlContent: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">面试通知</h2>
            <p>{{name}} 同学，您好！</p>
            <p>恭喜您通过代码书院实验室的初步审核，我们诚邀您参加面试。</p>
            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0;">面试信息</h3>
              <p><strong>面试时间：</strong>{{interviewDate}}</p>
              <p><strong>面试地点：</strong>{{room}} ({{location}})</p>
            </div>
            <p>请准时参加面试，并携带相关证件。</p>
            <p>如有疑问，请联系我们。</p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
            <p style="color: #6b7280; font-size: 14px;">代码书院实验室</p>
          </div>
        `,
        variables: JSON.stringify(['name', 'interviewDate', 'room', 'location']),
      },
      {
        type: EmailTemplateType.INTERVIEW_RESULT_ACCEPTED,
        name: '面试通过通知',
        subject: '代码书院实验室 - 录用通知',
        htmlContent: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #16a34a;">🎉 恭喜您，{{name}}！</h2>
            <p>您的代码书院实验室申请面试已通过！</p>
            <p>欢迎加入我们的团队！</p>
            <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #16a34a;">
              <h3 style="margin-top: 0; color: #16a34a;">面试官评语</h3>
              <p>{{feedback}}</p>
            </div>
            <p>后续事宜我们会另行通知，请保持联系方式畅通。</p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
            <p style="color: #6b7280; font-size: 14px;">代码书院实验室</p>
          </div>
        `,
        variables: JSON.stringify(['name', 'feedback']),
      },
      {
        type: EmailTemplateType.INTERVIEW_RESULT_REJECTED,
        name: '面试未通过通知',
        subject: '代码书院实验室 - 面试结果',
        htmlContent: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">感谢您的申请，{{name}}</h2>
            <p>很遗憾，您的代码书院实验室申请面试未通过。</p>
            <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
              <h3 style="margin-top: 0; color: #d97706;">面试反馈</h3>
              <p>{{feedback}}</p>
            </div>
            <p>这并不代表您的能力不足，只是目前的匹配度还有待提升。我们鼓励您：</p>
            <ul>
              <li>继续提升技术能力</li>
              <li>积累更多项目经验</li>
              <li>关注我们的下一次招新</li>
            </ul>
            <p>期待未来有机会再次合作！</p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
            <p style="color: #6b7280; font-size: 14px;">代码书院实验室</p>
          </div>
        `,
        variables: JSON.stringify(['name', 'feedback']),
      },
      {
        type: EmailTemplateType.PASSWORD_RESET,
        name: '密码重置通知',
        subject: '代码书院实验室 - 密码重置通知',
        htmlContent: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">密码重置通知</h2>
            <p>您好，{{name}}！</p>
            <p>您的账户密码已被管理员重置。</p>
            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p><strong>新密码：</strong></p>
              <code style="font-size: 18px; font-weight: bold; color: #dc2626;">{{newPassword}}</code>
            </div>
            <p>请使用新密码登录系统，并建议您登录后及时修改密码。</p>
            <p>如有疑问，请联系管理员。</p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
            <p style="color: #6b7280; font-size: 14px;">代码书院实验室</p>
          </div>
        `,
        variables: JSON.stringify(['name', 'newPassword']),
      },
    ];

    for (const templateData of defaultTemplates) {
      try {
        await this.updateTemplate(templateData.type, templateData);
        console.log(`✅ 邮件模板初始化完成: ${templateData.name}`);
      } catch (error) {
        console.error(`❌ 邮件模板初始化失败: ${templateData.name}`, error);
      }
    }

    console.log('邮件模板初始化完成');
  }
}

export default EmailTemplateService;