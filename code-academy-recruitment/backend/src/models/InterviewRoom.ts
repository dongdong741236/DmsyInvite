import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Interview } from './Interview';

@Entity('interview_rooms')
export class InterviewRoom {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column()
  location!: string;

  @Column({ type: 'int' })
  capacity!: number;

  @Column({ default: true })
  isActive!: boolean;

  @OneToMany(() => Interview, (interview) => interview.room)
  interviews!: Interview[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}