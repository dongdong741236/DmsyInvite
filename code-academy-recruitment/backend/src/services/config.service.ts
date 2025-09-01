import { AppDataSource } from '../config/database';
import { SystemConfig } from '../models/SystemConfig';
import { RecruitmentYear } from '../models/RecruitmentYear';

export class ConfigService {
  private static getRepository() {
    return AppDataSource.getRepository(SystemConfig);
  }

  private static getRecruitmentYearRepository() {
    return AppDataSource.getRepository(RecruitmentYear);
  }

  // 获取当前年度配置
  private static async getCurrentYearConfig() {
    const yearRepo = this.getRecruitmentYearRepository();
    const currentYear = await yearRepo.findOne({
      where: { isActive: true },
    });
    return currentYear?.recruitmentConfig;
  }

  // 获取配置值
  static async get(key: string, defaultValue: string = ''): Promise<string> {
    try {
      const configRepository = this.getRepository();
      const config = await configRepository.findOne({
        where: { key, isActive: true },
      });
      return config ? config.value : defaultValue;
    } catch (error) {
      return defaultValue;
    }
  }

  // 设置配置值
  static async set(key: string, value: string, description?: string): Promise<void> {
    const configRepository = this.getRepository();
    const existingConfig = await configRepository.findOne({ where: { key } });
    
    if (existingConfig) {
      existingConfig.value = value;
      if (description) existingConfig.description = description;
      await configRepository.save(existingConfig);
    } else {
      const newConfig = configRepository.create({
        key,
        value,
        description,
      });
      await configRepository.save(newConfig);
    }
  }

  // 获取所有配置
  static async getAll(): Promise<SystemConfig[]> {
    const configRepository = this.getRepository();
    return await configRepository.find({
      where: { isActive: true },
      order: { key: 'ASC' },
    });
  }

  // 批量设置配置
  static async setBatch(configs: { key: string; value: string; description?: string }[]): Promise<void> {
    for (const config of configs) {
      await this.set(config.key, config.value, config.description);
    }
  }

  // 初始化默认配置
  static async initializeDefaults(): Promise<void> {
    const defaultConfigs = [
      {
        key: 'recruitment.freshman.enabled',
        value: 'true',
        description: '是否开启大一学生纳新',
      },
      {
        key: 'recruitment.sophomore.enabled',
        value: 'true',
        description: '是否开启大二学生纳新',
      },
      {
        key: 'recruitment.application.deadline',
        value: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30天后
        description: '申请截止时间',
      },
      {
        key: 'recruitment.application.start_time',
        value: new Date().toISOString(),
        description: '申请开始时间',
      },
      {
        key: 'recruitment.max_applications_per_user',
        value: '1',
        description: '每个用户最大申请数量',
      },
    ];

    for (const config of defaultConfigs) {
      const configRepository = this.getRepository();
      const existing = await configRepository.findOne({ where: { key: config.key } });
      if (!existing) {
        await this.set(config.key, config.value, config.description);
      }
    }
  }

  // 检查申请是否开放
  static async isApplicationOpen(grade?: string): Promise<{ open: boolean; reason?: string }> {
    try {
      console.log('检查申请是否开放，年级:', grade);
      
      if (!grade) {
        console.log('未提供年级信息');
        return { open: false, reason: '请选择年级' };
      }

      // 获取当前年度配置
      const yearConfig = await this.getCurrentYearConfig();
      if (!yearConfig) {
        console.log('未找到年度配置，使用默认配置');
        // 回退到系统配置
        return this.isApplicationOpenFallback(grade);
      }

      // 根据年级检查对应的配置
      let isOpen: boolean;
      if (grade === 'freshman' || grade === '大一') {
        isOpen = yearConfig.freshmanApplicationOpen;
      } else if (grade === 'sophomore' || grade === '大二') {
        isOpen = yearConfig.sophomoreApplicationOpen;
      } else {
        console.log('无效的年级:', grade);
        return { open: false, reason: '无效的年级选择' };
      }

      console.log(`年度配置 ${grade} 申请开放状态:`, isOpen);
      
      if (!isOpen) {
        const gradeName = (grade === 'freshman' || grade === '大一') ? '大一' : '大二';
        return { open: false, reason: `${gradeName}申请暂未开放` };
      }

      // 检查截止时间
      const deadline = (grade === 'freshman' || grade === '大一') ? yearConfig.freshmanDeadline : yearConfig.sophomoreDeadline;
      if (deadline) {
        const now = new Date();
        const deadlineDate = new Date(deadline);
        if (now > deadlineDate) {
          const gradeName = (grade === 'freshman' || grade === '大一') ? '大一' : '大二';
          return { open: false, reason: `${gradeName}申请已截止` };
        }
      }

      return { open: true };
    } catch (error) {
      console.error('检查申请开放状态时出错:', error);
      return { open: false, reason: '系统错误，请稍后重试' };
    }
  }

  // 回退到系统配置的方法
  private static async isApplicationOpenFallback(grade: string): Promise<{ open: boolean; reason?: string }> {
    const now = new Date();
    
    // 检查申请时间范围
    const startTime = await this.get('recruitment.application.start_time');
    const deadline = await this.get('recruitment.application.deadline');
    
    if (startTime && new Date(startTime) > now) {
      return { open: false, reason: '申请尚未开始' };
    }
    
    if (deadline && new Date(deadline) < now) {
      return { open: false, reason: '申请已截止' };
    }
    
    // 检查年级是否开放
    if (grade === 'freshman' || grade === '大一') {
      const freshmanEnabled = await this.get('recruitment.freshman.enabled', 'true');
      if (freshmanEnabled !== 'true') {
        return { open: false, reason: '大一学生纳新暂未开放' };
      }
    } else if (grade === 'sophomore' || grade === '大二') {
      const sophomoreEnabled = await this.get('recruitment.sophomore.enabled', 'true');
      if (sophomoreEnabled !== 'true') {
        return { open: false, reason: '大二学生纳新暂未开放' };
      }
    } else {
      return { open: false, reason: '只接受大一、大二学生申请' };
    }
    
    return { open: true };
  }
}