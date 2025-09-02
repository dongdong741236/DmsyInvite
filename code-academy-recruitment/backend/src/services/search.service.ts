import { AppDataSource } from '../config/database';
import { Application } from '../models/Application';

export class SearchService {
  /**
   * 使用 MySQL 8.0 全文搜索功能搜索申请
   */
  static async searchApplications(query: string, limit: number = 20, offset: number = 0) {
    const applicationRepository = AppDataSource.getRepository(Application);
    
    // 使用 MySQL 的全文搜索 (需要创建全文索引)
    const applications = await applicationRepository
      .createQueryBuilder('application')
      .leftJoinAndSelect('application.user', 'user')
      .leftJoinAndSelect('application.interview', 'interview')
      .where(
        `MATCH(application.introduction, application.skills, application.experience, application.motivation) AGAINST(:query IN NATURAL LANGUAGE MODE)`,
        { query }
      )
      .orWhere('user.name LIKE :likeQuery', { likeQuery: `%${query}%` })
      .orWhere('user.email LIKE :likeQuery', { likeQuery: `%${query}%` })
      .orWhere('application.studentId LIKE :likeQuery', { likeQuery: `%${query}%` })
      .limit(limit)
      .offset(offset)
      .getMany();

    return applications;
  }

  /**
   * 使用 MySQL 8.0 JSON 函数查询面试评分
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
        `JSON_EXTRACT(interview.evaluationScores, '$.${scoreType}') >= :minScore`,
        { minScore }
      )
      .orderBy(`JSON_EXTRACT(interview.evaluationScores, '$.${scoreType}')`, 'DESC')
      .getMany();
  }

  /**
   * 复杂统计查询 - 使用 MySQL 8.0 窗口函数
   */
  static async getApplicationStatistics() {
    const query = `
      SELECT 
        status,
        COUNT(*) as count,
        ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage,
        AVG(CASE 
          WHEN interview.evaluationScores IS NOT NULL 
          THEN JSON_EXTRACT(interview.evaluationScores, '$.overall')
          ELSE NULL 
        END) as avg_score
      FROM applications application
      LEFT JOIN interviews interview ON application.id = interview.applicationId
      GROUP BY status
      ORDER BY count DESC;
    `;

    return await AppDataSource.query(query);
  }

  /**
   * 使用 MySQL 字符串函数获取技能统计
   */
  static async getSkillsAnalysis() {
    const query = `
      SELECT 
        TRIM(LOWER(SUBSTRING_INDEX(SUBSTRING_INDEX(skills, ',', numbers.n), ',', -1))) as skill,
        COUNT(*) as frequency
      FROM applications
      CROSS JOIN (
        SELECT 1 n UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL 
        SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL
        SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9 UNION ALL SELECT 10
      ) numbers
      WHERE skills IS NOT NULL 
        AND skills != ''
        AND CHAR_LENGTH(skills) - CHAR_LENGTH(REPLACE(skills, ',', '')) >= numbers.n - 1
      GROUP BY skill
      HAVING skill != '' AND frequency > 1
      ORDER BY frequency DESC
      LIMIT 20;
    `;

    return await AppDataSource.query(query);
  }

  /**
   * MySQL 8.0 CTE (通用表表达式) 示例
   */
  static async getApplicationTrends() {
    const query = `
      WITH monthly_stats AS (
        SELECT 
          DATE_FORMAT(createdAt, '%Y-%m') as month,
          status,
          COUNT(*) as count
        FROM applications
        WHERE createdAt >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
        GROUP BY DATE_FORMAT(createdAt, '%Y-%m'), status
      )
      SELECT 
        month,
        SUM(CASE WHEN status = 'pending' THEN count ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'accepted' THEN count ELSE 0 END) as accepted,
        SUM(CASE WHEN status = 'rejected' THEN count ELSE 0 END) as rejected,
        SUM(count) as total
      FROM monthly_stats
      GROUP BY month
      ORDER BY month DESC;
    `;

    return await AppDataSource.query(query);
  }

  /**
   * 使用 MySQL JSON 函数分析面试评分分布
   */
  static async getScoreDistribution() {
    const query = `
      SELECT 
        CASE 
          WHEN JSON_EXTRACT(evaluationScores, '$.overall') >= 90 THEN '优秀 (90+)'
          WHEN JSON_EXTRACT(evaluationScores, '$.overall') >= 80 THEN '良好 (80-89)'
          WHEN JSON_EXTRACT(evaluationScores, '$.overall') >= 70 THEN '中等 (70-79)'
          WHEN JSON_EXTRACT(evaluationScores, '$.overall') >= 60 THEN '及格 (60-69)'
          ELSE '不及格 (<60)'
        END as score_range,
        COUNT(*) as count,
        ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
      FROM interviews
      WHERE evaluationScores IS NOT NULL
        AND JSON_EXTRACT(evaluationScores, '$.overall') IS NOT NULL
      GROUP BY score_range
      ORDER BY MIN(JSON_EXTRACT(evaluationScores, '$.overall')) DESC;
    `;

    return await AppDataSource.query(query);
  }
}