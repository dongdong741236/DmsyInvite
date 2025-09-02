import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './User';
import { Interview } from './Interview';
import { RecruitmentYear } from './RecruitmentYear';

export enum ApplicationStatus {
  PENDING = 'pending',
  REVIEWING = 'reviewing',
  APPROVED = 'approved', // 审核通过，可安排面试
  INTERVIEW_SCHEDULED = 'interview_scheduled',
  INTERVIEWED = 'interviewed',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
}

@Entity('applications')
export class Application {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => User, (user) => user.applications)
  user!: User;

  @Column()
  studentId!: string;

  @Column()
  campusCardId!: string; // 一卡通号

  @Column()
  phone!: string;

  @Column()
  major!: string;

  @Column()
  grade!: string;

  // 照片字段
  @Column({ nullable: true })
  personalPhoto?: string;

  @Column({ nullable: true })
  studentCardPhoto?: string;

  @Column({ type: 'text' })
  introduction!: string;

  @Column({ type: 'text' })
  skills!: string;

  @Column({ type: 'text' })
  experience!: string;

  @Column({ type: 'json', nullable: true })
  experienceAttachments?: string[]; // 存储多个文件路径

  @Column({ type: 'text' })
  motivation!: string;

  @Column({ type: 'text', nullable: true })
  portfolio?: string;

  // 年级相关详细信息
  @Column({ type: 'json', nullable: true })
  gradeSpecificInfo?: {
    // 大一学生信息
    highSchoolInfo?: {
      highSchoolName?: string;
      gaokaoScore?: number;
      hasCodeExperience?: boolean;
      codeExperienceDesc?: string;
    };
    // 大二学生信息
    sophomoreInfo?: {
      gpa?: number;
      isTransferStudent?: boolean;
      originalMajor?: string;
      newMajor?: string;
      cLanguageGrade?: string;
      cppLanguageGrade?: string;
    };
  };

  @Column({
    type: 'enum',
    enum: ApplicationStatus,
    default: ApplicationStatus.PENDING,
  })
  status!: ApplicationStatus;

  @OneToOne(() => Interview, (interview) => interview.application, { nullable: true })
  interview?: Interview;

  @Column({ type: 'text', nullable: true })
  reviewNotes?: string;

  // 关联招新年度（可选，保持向后兼容）
  @ManyToOne(() => RecruitmentYear, (year) => year.applications, { nullable: true })
  @JoinColumn()
  recruitmentYear?: RecruitmentYear;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}