import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  ManyToOne,
  ManyToMany,
  JoinColumn,
  JoinTable,
} from 'typeorm';
import { Application } from './Application';
import { InterviewRoom } from './InterviewRoom';
import { RecruitmentYear } from './RecruitmentYear';
import { Interviewer } from './Interviewer';

export enum InterviewResult {
  PASSED = 'passed',
  FAILED = 'failed',
  PENDING = 'pending',
}

@Entity('interviews')
export class Interview {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @OneToOne(() => Application, (application) => application.interview)
  @JoinColumn()
  application!: Application;

  @ManyToOne(() => InterviewRoom, (room) => room.interviews)
  room!: InterviewRoom;

  @Column({ type: 'timestamp' })
  scheduledAt!: Date;

  @Column({ type: 'text', nullable: true })
  interviewerNotes?: string;

  @Column({ type: 'json', nullable: true })
  evaluationScores?: {
    technical?: number;
    communication?: number;
    teamwork?: number;
    motivation?: number;
    overall?: number;
  };

  @Column({ type: 'json', nullable: true })
  questionAnswers?: {
    questionId: string;
    question: string;
    answer: string;
    score?: number;
  }[];

  @Column({
    type: 'enum',
    enum: InterviewResult,
    default: InterviewResult.PENDING,
  })
  result!: InterviewResult;

  @Column({ default: false })
  isCompleted!: boolean;

  @Column({ default: false })
  notificationSent!: boolean;

  // 关联招新年度（可选，保持向后兼容）
  @ManyToOne(() => RecruitmentYear, (year) => year.interviews, { nullable: true })
  @JoinColumn()
  recruitmentYear?: RecruitmentYear;

  // 面试者（多对多关系）
  @ManyToMany(() => Interviewer, (interviewer) => interviewer.interviews)
  @JoinTable({
    name: 'interview_interviewers',
    joinColumn: { name: 'interview_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'interviewer_id', referencedColumnName: 'id' },
  })
  interviewers!: Interviewer[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}