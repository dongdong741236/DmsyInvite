import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
} from 'typeorm';
import { Interview } from './Interview';

@Entity('interviewers')
export class Interviewer {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column({ unique: true })
  email!: string;

  @Column({ nullable: true })
  phone?: string;

  @Column({ nullable: true })
  title?: string; // 职位或称号，如"学长"、"导师"

  @Column({ nullable: true })
  department?: string; // 所属部门

  @Column({ type: 'text', nullable: true })
  expertise?: string; // 专业领域

  @Column({ default: true })
  isActive!: boolean;

  // 参与的面试（多对多关系）
  @ManyToMany(() => Interview, (interview) => interview.interviewers)
  interviews!: Interview[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}