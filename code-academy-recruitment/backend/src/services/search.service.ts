import { AppDataSource } from '../config/database';
import { Application } from '../models/Application';
import { User } from '../models/User';

export class SearchService {
  /**
   * 使用 PostgreSQL 全文搜索功能搜索申请
   */
  static async searchApplications(query: string, limit: number = 20, offset: number = 0) {
    const applicationRepository = AppDataSource.getRepository(Application);
    
    // 使用 PostgreSQL 的全文搜索
    const applications = await applicationRepository
      .createQueryBuilder('application')
      .leftJoinAndSelect('application.user', 'user')
      .leftJoinAndSelect('application.interview', 'interview')
      .where(
        `to_tsvector('english', application.introduction || ' ' || 
         application.skills || ' ' || application.experience || ' ' || 
         application.motivation) @@ plainto_tsquery('english', :query)`,
        { query }
      )
      .orWhere(
        `to_tsvector('english', user.name || ' ' || user.email) @@ plainto_tsquery('english', :query)`,
        { query }
      )
      .orderBy(
        `ts_rank(to_tsvector('english', application.introduction || ' ' || 
         application.skills || ' ' || application.experience || ' ' || 
         application.motivation), plainto_tsquery('english', :query))`,
        'DESC'
      )
      .limit(limit)
      .offset(offset)
      .getMany();

    return applications;
  }

  /**
   * 使用 JSONB 查询面试评分
   */
  static async searchByEvaluationScore(
    minScore: number,
    scoreType: 'technical' | 'communication' | 'teamwork' | 'motivation' | 'overall' = 'overall'
  ) {
    const applicationRepository = AppDataSource.getRepository(Application);
    
    return await applicationRepository
      .createQueryBuilder('application')
      .leftJoinAndSelect('application.interview', 'interview')
      .leftJoinAndSelect('application.user', 'user')
      .where(
        `CAST(interview.evaluationScores->>:scoreType AS INTEGER) >= :minScore`,
        { scoreType, minScore }
      )
      .orderBy(`CAST(interview.evaluationScores->>:scoreType AS INTEGER)`, 'DESC')
      .getMany();
  }

  /**
   * 复杂统计查询 - 使用 PostgreSQL 窗口函数
   */
  static async getApplicationStatistics() {
    const query = `
      SELECT 
        status,
        COUNT(*) as count,
        ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage,
        AVG(CASE 
          WHEN interview.evaluation_scores IS NOT NULL 
          THEN CAST(interview.evaluation_scores->>'overall' AS INTEGER) 
          ELSE NULL 
        END) as avg_score
      FROM applications application
      LEFT JOIN interviews interview ON application.id = interview.application_id
      GROUP BY status
      ORDER BY count DESC;
    `;

    return await AppDataSource.query(query);
  }

  /**
   * 使用数组聚合获取技能统计
   */
  static async getSkillsAnalysis() {
    const query = `
      SELECT 
        unnest(string_to_array(lower(skills), ',')) as skill,
        COUNT(*) as frequency
      FROM applications
      WHERE skills IS NOT NULL AND skills != ''
      GROUP BY skill
      HAVING COUNT(*) > 1
      ORDER BY frequency DESC
      LIMIT 20;
    `;

    return await AppDataSource.query(query);
  }
}