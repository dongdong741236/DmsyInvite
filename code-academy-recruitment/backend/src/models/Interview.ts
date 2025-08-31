import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Application } from './Application';
import { InterviewRoom } from './InterviewRoom';

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

  @Column({ type: 'jsonb', nullable: true })
  evaluationScores?: {
    technical?: number;
    communication?: number;
    teamwork?: number;
    motivation?: number;
    overall?: number;
  };

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

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}