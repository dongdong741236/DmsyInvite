import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum QuestionCategory {
  TECHNICAL = 'technical',
  BEHAVIORAL = 'behavioral',
  MOTIVATION = 'motivation',
  GENERAL = 'general',
}

@Entity('interview_questions')
export class InterviewQuestion {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  question!: string;

  @Column({
    type: 'enum',
    enum: QuestionCategory,
    default: QuestionCategory.GENERAL,
  })
  category!: QuestionCategory;

  @Column({ type: 'text', nullable: true })
  description?: string; // 问题说明或评分标准

  @Column({ default: true })
  isActive!: boolean;

  @Column({ default: 0 })
  sortOrder!: number; // 排序顺序

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}