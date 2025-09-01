import { AppDataSource } from '../config/database';
import { RecruitmentYear } from '../models/RecruitmentYear';

export class RecruitmentYearService {
  private static getRepository() {
    return AppDataSource.getRepository(RecruitmentYear);
  }

  // 获取当前活跃年度
  static async getCurrentYear(): Promise<RecruitmentYear | null> {
    const repository = this.getRepository();
    return await repository.findOne({
      where: { isActive: true },
    });
  }

  // 获取所有年度
  static async getAllYears(): Promise<RecruitmentYear[]> {
    const repository = this.getRepository();
    return await repository.find({
      order: { year: 'DESC' },
    });
  }

  // 创建新年度
  static async createYear(data: {
    year: number;
    name: string;
    description?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<RecruitmentYear> {
    const repository = this.getRepository();
    
    const newYear = repository.create({
      ...data,
      isActive: false, // 新创建的年度默认不激活
      isArchived: false,
    });

    return await repository.save(newYear);
  }

  // 激活年度（同时将其他年度设为非活跃）
  static async activateYear(yearId: string): Promise<RecruitmentYear> {
    const repository = this.getRepository();
    
    // 将所有年度设为非活跃
    await repository.update({}, { isActive: false });
    
    // 激活指定年度
    const year = await repository.findOne({ where: { id: yearId } });
    if (!year) {
      throw new Error('Recruitment year not found');
    }
    
    year.isActive = true;
    return await repository.save(year);
  }

  // 归档年度
  static async archiveYear(yearId: string): Promise<RecruitmentYear> {
    const repository = this.getRepository();
    
    const year = await repository.findOne({ where: { id: yearId } });
    if (!year) {
      throw new Error('Recruitment year not found');
    }
    
    year.isArchived = true;
    year.isActive = false; // 归档的年度不能是活跃的
    
    return await repository.save(year);
  }

  // 初始化默认年度
  static async initializeDefaultYear(): Promise<void> {
    console.log('开始初始化招新年度...');
    
    const repository = this.getRepository();
    const currentYear = new Date().getFullYear();
    
    // 检查是否已有当前年度
    const existingYear = await repository.findOne({
      where: { year: currentYear },
    });
    
    if (!existingYear) {
      const defaultYear = repository.create({
        year: currentYear,
        name: `${currentYear}年招新`,
        description: `${currentYear}年代码书院实验室招新`,
        startDate: new Date(`${currentYear}-08-01`),
        endDate: new Date(`${currentYear}-12-31`),
        isActive: true,
        isArchived: false,
      });
      
      await repository.save(defaultYear);
      console.log(`✅ 默认招新年度创建完成: ${currentYear}年`);
    } else {
      console.log(`✅ 招新年度已存在: ${currentYear}年`);
    }
  }
}

export default RecruitmentYearService;