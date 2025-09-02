import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import api from '../services/api';
import {
  CalendarDaysIcon,
  ClockIcon,
  BuildingOfficeIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClipboardDocumentListIcon,
} from '@heroicons/react/24/outline';

interface InterviewSchedule {
  applicationId: string;
  interviewId: string;
  scheduledAt: string;
  room: {
    name: string;
    location: string;
  };
  status: string;
  isCompleted: boolean;
  result?: string;
  notificationSent?: boolean;
}

const InterviewScheduleCard: React.FC = () => {
  const [schedules, setSchedules] = useState<InterviewSchedule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInterviewSchedules();
  }, []);

  const loadInterviewSchedules = async () => {
    try {
      setLoading(true);
      const response = await api.get<InterviewSchedule[]>('/applications/my/interviews');
      console.log('Interview schedules data:', response.data);
      // 调试：检查返回的数据
      response.data.forEach((schedule, index) => {
        console.log(`Schedule ${index}:`, {
          notificationSent: schedule.notificationSent,
          result: schedule.result,
          isCompleted: schedule.isCompleted
        });
      });
      setSchedules(response.data);
    } catch (error) {
      console.error('Failed to load interview schedules:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (schedule: InterviewSchedule) => {
    // 未完成面试
    if (!schedule.isCompleted) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          <ClockIcon className="w-3 h-3 mr-1" />
          待面试
        </span>
      );
    }
    
    // 面试已完成，检查是否已发送通知
    // 使用严格相等检查，确保notificationSent必须是true
    const canShowResult = schedule.notificationSent === true;
    
    // 调试日志
    console.log('Status badge check:', {
      interviewId: schedule.interviewId,
      notificationSent: schedule.notificationSent,
      result: schedule.result,
      canShowResult
    });
    
    if (!canShowResult) {
      // 未发送通知，显示等待状态
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          <ClockIcon className="w-3 h-3 mr-1" />
          等待结果通知
        </span>
      );
    }
    
    // 已发送通知，根据结果显示状态
    switch (schedule.result) {
      case 'passed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircleIcon className="w-3 h-3 mr-1" />
            面试通过
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <ExclamationTriangleIcon className="w-3 h-3 mr-1" />
            面试未通过
          </span>
        );
      default:
        // 已发送通知但结果为空或其他值
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            <ClockIcon className="w-3 h-3 mr-1" />
            等待结果通知
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="neumorphic-card p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (schedules.length === 0) {
    return null; // 没有面试安排就不显示
  }

  return (
    <div className="neumorphic-card">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center">
          <ClipboardDocumentListIcon className="w-5 h-5 text-primary-600 mr-2" />
          <h3 className="text-lg font-semibold">面试安排</h3>
        </div>
      </div>
      
      <div className="divide-y divide-gray-200">
        {schedules.map((schedule) => (
          <div key={schedule.interviewId} className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-4 mb-4">
                  <CalendarDaysIcon className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-lg font-medium text-gray-900">
                      {format(new Date(schedule.scheduledAt), 'yyyy年MM月dd日 EEEE', { locale: zhCN })}
                    </p>
                    <p className="text-sm text-gray-600">
                      {format(new Date(schedule.scheduledAt), 'HH:mm', { locale: zhCN })} 开始
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-4 mb-4">
                  <BuildingOfficeIcon className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-900">{schedule.room.name}</p>
                    <p className="text-sm text-gray-600">{schedule.room.location}</p>
                  </div>
                </div>


              </div>
              
              <div className="flex-shrink-0 ml-4">
                {getStatusBadge(schedule)}
              </div>
            </div>

            {!schedule.isCompleted && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>面试提醒：</strong>请提前10分钟到达面试地点，携带学生证和相关材料。
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default InterviewScheduleCard;