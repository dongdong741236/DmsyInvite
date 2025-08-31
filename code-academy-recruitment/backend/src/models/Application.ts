import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToOne,
} from 'typeorm';
import { User } from './User';
import { Interview } from './Interview';

export enum ApplicationStatus {
  PENDING = 'pending',
  REVIEWING = 'reviewing',
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
  phone!: string;

  @Column()
  major!: string;

  @Column()
  grade!: string;

  @Column({ type: 'text' })
  introduction!: string;

  @Column({ type: 'text' })
  skills!: string;

  @Column({ type: 'text' })
  experience!: string;

  @Column({ type: 'text' })
  motivation!: string;

  @Column({ type: 'text', nullable: true })
  portfolio?: string;

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

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}