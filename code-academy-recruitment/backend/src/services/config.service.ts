import { AppDataSource } from '../config/database';
import { SystemConfig } from '../models/SystemConfig';

export class ConfigService {
  private static configRepository = AppDataSource.getRepository(SystemConfig);

  // 获取配置值
  static async get(key: string, defaultValue: string = ''): Promise<string> {
    try {
      const config = await this.configRepository.findOne({
        where: { key, isActive: true },
      });
      return config ? config.value : defaultValue;
    } catch (error) {
      return defaultValue;
    }
  }

  // 设置配置值
  static async set(key: string, value: string, description?: string): Promise<void> {
    const existingConfig = await this.configRepository.findOne({ where: { key } });
    
    if (existingConfig) {
      existingConfig.value = value;
      if (description) existingConfig.description = description;
      await this.configRepository.save(existingConfig);
    } else {
      const newConfig = this.configRepository.create({
        key,
        value,
        description,
      });
      await this.configRepository.save(newConfig);
    }
  }

  // 获取所有配置
  static async getAll(): Promise<SystemConfig[]> {
    return await this.configRepository.find({
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
      const existing = await this.configRepository.findOne({ where: { key: config.key } });
      if (!existing) {
        await this.set(config.key, config.value, config.description);
      }
    }
  }

  // 检查申请是否开放
  static async isApplicationOpen(grade: string): Promise<{ open: boolean; reason?: string }> {
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
    if (grade === '大一') {
      const freshmanEnabled = await this.get('recruitment.freshman.enabled', 'true');
      if (freshmanEnabled !== 'true') {
        return { open: false, reason: '大一学生纳新暂未开放' };
      }
    } else if (grade === '大二') {
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