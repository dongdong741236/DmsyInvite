import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { Interview } from './Interview';
import { Interviewer } from './Interviewer';

@Entity('interview_rooms')
export class InterviewRoom {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column()
  location!: string;

  @Column({ default: true })
  isActive!: boolean;

  @OneToMany(() => Interview, (interview) => interview.room)
  interviews!: Interview[];

  // 教室内的面试官（多对多关系）
  @ManyToMany(() => Interviewer, { cascade: true })
  @JoinTable({
    name: 'room_interviewers',
    joinColumn: { name: 'room_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'interviewer_id', referencedColumnName: 'id' },
  })
  interviewers!: Interviewer[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}