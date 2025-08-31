import nodemailer from 'nodemailer';
import { logger } from './logger';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendEmail = async (options: EmailOptions) => {
  try {
    console.log('=== 开始发送邮件 ===');
    console.log('邮件配置:');
    console.log('EMAIL_HOST:', process.env.EMAIL_HOST);
    console.log('EMAIL_PORT:', process.env.EMAIL_PORT);
    console.log('EMAIL_USER:', process.env.EMAIL_USER);
    console.log('EMAIL_FROM:', process.env.EMAIL_FROM);
    console.log('收件人:', options.to);
    console.log('主题:', options.subject);

    const mailOptions = {
      from: process.env.EMAIL_FROM || 'Code Academy Lab <noreply@codeacademy.edu.cn>',
      to: options.to,
      subject: options.subject,
      html: options.html,
    };

    console.log('邮件选项:', mailOptions);
    logger.debug('Sending email with options:', mailOptions);

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ 邮件发送成功:', info.messageId);
    logger.info('Email sent successfully', { messageId: info.messageId, to: options.to });
    return info;
  } catch (error) {
    console.error('❌ 邮件发送失败:', error);
    logger.error('Email sending failed', { error, to: options.to });
    throw error;
  }
};

export const sendVerificationCode = async (email: string, code: string) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">代码书院 - 邮箱验证码</h2>
      <p>您好！</p>
      <p>您正在注册代码书院实验室纳新系统，您的邮箱验证码是：</p>
      <div style="text-align: center; margin: 24px 0;">
        <span style="display: inline-block; padding: 16px 32px; background-color: #f3f4f6; border: 2px solid #2563eb; border-radius: 8px; font-size: 24px; font-weight: bold; letter-spacing: 4px; color: #2563eb;">${code}</span>
      </div>
      <p><strong>验证码有效期为 10 分钟</strong>，请及时使用。</p>
      <p>如果您没有进行此操作，请忽略此邮件。</p>
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
      <p style="color: #6b7280; font-size: 14px;">此邮件由系统自动发送，请勿回复。</p>
    </div>
  `;

  await sendEmail({
    to: email,
    subject: '代码书院 - 邮箱验证码',
    html,
  });
};

export const sendVerificationEmail = async (email: string, token: string) => {
  const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">欢迎加入代码书院</h2>
      <p>您好！</p>
      <p>感谢您注册代码书院实验室纳新系统。请点击下面的链接验证您的邮箱：</p>
      <a href="${verificationUrl}" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px; margin: 16px 0;">验证邮箱</a>
      <p>或复制以下链接到浏览器：</p>
      <p style="word-break: break-all; color: #6b7280;">${verificationUrl}</p>
      <p>此链接有效期为24小时。</p>
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
      <p style="color: #6b7280; font-size: 14px;">如果您没有注册账号，请忽略此邮件。</p>
    </div>
  `;

  await sendEmail({
    to: email,
    subject: '代码书院 - 邮箱验证',
    html,
  });
};

export const sendInterviewNotification = async (
  email: string,
  name: string,
  interviewDate: Date,
  room: string,
  location: string
) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">面试通知</h2>
      <p>${name} 同学，您好！</p>
      <p>恭喜您通过了代码书院实验室的初步筛选，现邀请您参加面试。</p>
      <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p><strong>面试时间：</strong>${interviewDate.toLocaleString('zh-CN')}</p>
        <p><strong>面试地点：</strong>${room} - ${location}</p>
      </div>
      <p>请提前10分钟到达面试地点，并携带您的学生证。</p>
      <p>面试内容包括：</p>
      <ul>
        <li>个人介绍</li>
        <li>技术能力评估</li>
        <li>团队协作能力</li>
        <li>学习动机和规划</li>
      </ul>
      <p>如有任何问题，请回复此邮件。</p>
      <p>祝您面试顺利！</p>
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
      <p style="color: #6b7280; font-size: 14px;">代码书院实验室</p>
    </div>
  `;

  await sendEmail({
    to: email,
    subject: '代码书院实验室 - 面试通知',
    html,
  });
};

export const sendResultNotification = async (
  email: string,
  name: string,
  accepted: boolean,
  feedback?: string
) => {
  const html = accepted
    ? `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #10b981;">恭喜您！</h2>
      <p>${name} 同学，您好！</p>
      <p>我们很高兴地通知您，您已通过代码书院实验室的面试，正式成为我们的一员！</p>
      <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p>接下来的安排：</p>
        <ul>
          <li>我们将在一周内与您联系，安排入职培训</li>
          <li>请加入我们的新成员群（群号将通过短信发送）</li>
          <li>准备好开启您的学习之旅！</li>
        </ul>
      </div>
      ${feedback ? `<p><strong>面试官评语：</strong>${feedback}</p>` : ''}
      <p>期待与您共同成长！</p>
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
      <p style="color: #6b7280; font-size: 14px;">代码书院实验室</p>
    </div>
  `
    : `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #6b7280;">面试结果通知</h2>
      <p>${name} 同学，您好！</p>
      <p>感谢您对代码书院实验室的关注和参与面试。</p>
      <p>经过综合评估，很遗憾这次我们未能为您提供合适的职位。</p>
      ${feedback ? `<div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;"><p><strong>反馈建议：</strong>${feedback}</p></div>` : ''}
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
  `;

  await sendEmail({
    to: email,
    subject: `代码书院实验室 - ${accepted ? '录用通知' : '面试结果'}`,
    html,
  });
};