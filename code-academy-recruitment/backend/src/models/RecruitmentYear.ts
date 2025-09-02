import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Application } from './Application';
import { Interview } from './Interview';

@Entity('recruitment_years')
export class RecruitmentYear {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  year!: number; // 招新年度，如 2024

  @Column()
  name!: string; // 年度名称，如 "2024年秋季招新"

  @Column({ type: 'text', nullable: true })
  description?: string; // 年度描述

  @Column({ type: 'date', nullable: true })
  startDate?: Date; // 招新开始日期

  @Column({ type: 'date', nullable: true })
  endDate?: Date; // 招新结束日期

  @Column({ default: false })
  isActive!: boolean; // 是否为当前活跃年度

  @Column({ default: false })
  isArchived!: boolean; // 是否已归档

  // 纳新配置
  @Column({ type: 'json', nullable: true })
  recruitmentConfig?: {
    // 申请开放设置
    freshmanApplicationOpen: boolean;
    sophomoreApplicationOpen: boolean;
    
    // 申请截止时间
    freshmanDeadline?: string;
    sophomoreDeadline?: string;
    
    // 邮箱域名限制
    allowedEmailDomains: string[];
    
    // 其他配置
    maxApplicationsPerUser: number;
    requireEmailVerification: boolean;
    
    // 面试相关配置
    defaultInterviewDuration: number; // 分钟
    enableBatchInterview: boolean;
    
    // 通知配置
    autoSendNotifications: boolean;
    notificationEmailFrom: string;
  };

  // 关联的申请记录
  @OneToMany(() => Application, (application) => application.recruitmentYear)
  applications!: Application[];

  // 关联的面试记录
  @OneToMany(() => Interview, (interview) => interview.recruitmentYear)
  interviews!: Interview[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}