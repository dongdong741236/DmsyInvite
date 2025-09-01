import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';
import { Interview } from './Interview';
import { InterviewRoom } from './InterviewRoom';
import * as bcrypt from 'bcryptjs';

@Entity('interviewers')
export class Interviewer {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column({ unique: true })
  email!: string;

  @Column()
  password!: string;

  @Column({ default: 'interviewer' })
  role!: string; // 'interviewer' 角色

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

  // 负责的教室（多对多关系）
  @ManyToMany(() => InterviewRoom, (room) => room.interviewers)
  rooms!: InterviewRoom[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  // 密码哈希处理
  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword() {
    if (this.password) {
      const isHashed = this.password.startsWith('$2b$') || this.password.startsWith('$2a$');
      if (!isHashed) {
        this.password = await bcrypt.hash(this.password, 10);
        console.log('面试者密码已hash处理');
      }
    }
  }

  // 验证密码
  async validatePassword(password: string): Promise<boolean> {
    return await bcrypt.compare(password, this.password);
  }
}