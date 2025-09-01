import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum EmailTemplateType {
  VERIFICATION_CODE = 'verification_code',
  INTERVIEW_NOTIFICATION = 'interview_notification',
  INTERVIEW_RESULT_ACCEPTED = 'interview_result_accepted',
  INTERVIEW_RESULT_REJECTED = 'interview_result_rejected',
  PASSWORD_RESET = 'password_reset',
}

@Entity('email_templates')
export class EmailTemplate {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({
    type: 'enum',
    enum: EmailTemplateType,
    unique: true,
  })
  type!: EmailTemplateType;

  @Column()
  name!: string;

  @Column()
  subject!: string;

  @Column({ type: 'text' })
  htmlContent!: string;

  @Column({ type: 'text', nullable: true })
  variables?: string; // JSON格式存储可用变量说明

  @Column({ default: true })
  isActive!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}