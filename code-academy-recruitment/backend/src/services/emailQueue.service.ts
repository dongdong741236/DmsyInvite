import { sendResultNotification as sendResultEmail } from '../utils/email';

interface EmailTask {
  id: string;
  type: 'result_notification';
  data: {
    email: string;
    name: string;
    result: string;
    interviewId: string;
    applicationId: string;
  };
  status: 'pending' | 'processing' | 'completed' | 'failed';
  attempts: number;
  createdAt: Date;
  processedAt?: Date;
  error?: string;
}

class EmailQueueService {
  private queue: EmailTask[] = [];
  private isProcessing = false;
  private processInterval: NodeJS.Timeout | null = null;
  private readonly MAX_ATTEMPTS = 3;
  private readonly DELAY_BETWEEN_EMAILS = 2000; // 2秒间隔
  private readonly BATCH_SIZE = 10; // 每批处理10封邮件

  constructor() {
    this.startProcessing();
  }

  /**
   * 添加邮件任务到队列
   */
  public addToQueue(data: EmailTask['data']): string {
    const task: EmailTask = {
      id: `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'result_notification',
      data,
      status: 'pending',
      attempts: 0,
      createdAt: new Date(),
    };

    this.queue.push(task);
    console.log(`[EmailQueue] Added task ${task.id} to queue. Queue size: ${this.queue.length}`);
    
    return task.id;
  }

  /**
   * 批量添加邮件任务
   */
  public addBatchToQueue(emails: EmailTask['data'][]): string[] {
    const taskIds: string[] = [];
    
    for (const emailData of emails) {
      const taskId = this.addToQueue(emailData);
      taskIds.push(taskId);
    }

    console.log(`[EmailQueue] Added ${emails.length} tasks to queue`);
    return taskIds;
  }

  /**
   * 开始处理队列
   */
  private startProcessing(): void {
    if (this.processInterval) {
      return;
    }

    this.processInterval = setInterval(() => {
      this.processQueue();
    }, this.DELAY_BETWEEN_EMAILS);

    console.log('[EmailQueue] Started queue processing');
  }

  /**
   * 停止处理队列
   */
  public stopProcessing(): void {
    if (this.processInterval) {
      clearInterval(this.processInterval);
      this.processInterval = null;
      console.log('[EmailQueue] Stopped queue processing');
    }
  }

  /**
   * 处理队列中的任务
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing) {
      return;
    }

    const pendingTasks = this.queue.filter(task => task.status === 'pending');
    
    if (pendingTasks.length === 0) {
      return;
    }

    this.isProcessing = true;

    try {
      // 获取要处理的任务（最多BATCH_SIZE个）
      const tasksToProcess = pendingTasks.slice(0, this.BATCH_SIZE);
      
      for (const task of tasksToProcess) {
        await this.processTask(task);
        
        // 在每个邮件之间添加小延迟
        await this.delay(500);
      }
    } catch (error) {
      console.error('[EmailQueue] Error processing queue:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * 处理单个任务
   */
  private async processTask(task: EmailTask): Promise<void> {
    try {
      task.status = 'processing';
      task.attempts++;

      console.log(`[EmailQueue] Processing task ${task.id} (attempt ${task.attempts})`);

      // 发送邮件
      await sendResultEmail(
        task.data.email,
        task.data.name,
        task.data.result === 'passed',
        undefined // feedback参数是可选的
      );

      task.status = 'completed';
      task.processedAt = new Date();

      console.log(`[EmailQueue] Task ${task.id} completed successfully`);

      // 从队列中移除已完成的任务
      this.removeCompletedTask(task.id);
    } catch (error: any) {
      console.error(`[EmailQueue] Task ${task.id} failed:`, error.message);

      task.error = error.message;

      if (task.attempts >= this.MAX_ATTEMPTS) {
        task.status = 'failed';
        console.error(`[EmailQueue] Task ${task.id} failed after ${this.MAX_ATTEMPTS} attempts`);
        
        // 保留失败的任务记录，但不再重试
        // 可以考虑将失败的任务存储到数据库中以便后续处理
      } else {
        task.status = 'pending'; // 重置为待处理，等待重试
        console.log(`[EmailQueue] Task ${task.id} will be retried`);
      }
    }
  }

  /**
   * 移除已完成的任务
   */
  private removeCompletedTask(taskId: string): void {
    const index = this.queue.findIndex(task => task.id === taskId);
    if (index !== -1) {
      this.queue.splice(index, 1);
    }
  }

  /**
   * 延迟函数
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 获取队列状态
   */
  public getQueueStatus(): {
    total: number;
    pending: number;
    processing: number;
    completed: number;
    failed: number;
  } {
    const status = {
      total: this.queue.length,
      pending: 0,
      processing: 0,
      completed: 0,
      failed: 0,
    };

    for (const task of this.queue) {
      status[task.status]++;
    }

    return status;
  }

  /**
   * 获取队列中的任务列表
   */
  public getQueueTasks(): EmailTask[] {
    return [...this.queue];
  }

  /**
   * 清空队列
   */
  public clearQueue(): void {
    this.queue = [];
    console.log('[EmailQueue] Queue cleared');
  }

  /**
   * 重试失败的任务
   */
  public retryFailedTasks(): number {
    let count = 0;
    
    for (const task of this.queue) {
      if (task.status === 'failed') {
        task.status = 'pending';
        task.attempts = 0;
        task.error = undefined;
        count++;
      }
    }

    console.log(`[EmailQueue] Retrying ${count} failed tasks`);
    return count;
  }
}

// 导出单例实例
export const emailQueueService = new EmailQueueService();

// 导出类型
export type { EmailTask };