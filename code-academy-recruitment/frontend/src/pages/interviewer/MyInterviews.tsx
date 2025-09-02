import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import api from '../../services/api';
import {
  CalendarDaysIcon,
  ClockIcon,
  UserIcon,
  BuildingOfficeIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';

interface Interview {
  id: string;
  scheduledAt: string;
  application: {
    id: string;
    user: {
      name: string;
      email: string;
    };
    grade: string;
    major: string;
    phone: string;
  };
  room: {
    name: string;
    location: string;
  };
  isCompleted: boolean;
  result?: 'passed' | 'failed' | 'pending';
  score?: number;
  feedback?: string;
}

const MyInterviews: React.FC = () => {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');

  useEffect(() => {
    loadInterviews();
  }, []);

  const loadInterviews = async () => {
    try {
      setLoading(true);
      console.log('=== 面试官加载面试列表 ===');
      const response = await api.get('/interviewer/interviews');
      console.log('面试官面试数据:', response.data);
      setInterviews(response.data);
    } catch (error) {
      console.error('Failed to load interviews:', error);
      console.error('面试官API错误详情:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredInterviews = interviews.filter(interview => {
    switch (filter) {
      case 'pending':
        return !interview.isCompleted;
      case 'completed':
        return interview.isCompleted;
      default:
        return true;
    }
  });

  const getResultBadge = (interview: Interview) => {
    if (!interview.isCompleted) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          待面试
        </span>
      );
    }

    switch (interview.result) {
      case 'passed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            通过
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            未通过
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            已面试
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center">
          <CalendarDaysIcon className="w-8 h-8 text-primary-600 mr-3" />
          <h1 className="text-3xl font-bold">我的面试</h1>
        </div>
      </div>

      {/* 过滤器 */}
      <div className="neumorphic-card p-4 mb-6">
        <div className="flex space-x-4">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'all'
                ? 'bg-primary-100 text-primary-700'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            全部 ({interviews.length})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'pending'
                ? 'bg-yellow-100 text-yellow-700'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            待面试 ({interviews.filter(i => !i.isCompleted).length})
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'completed'
                ? 'bg-green-100 text-green-700'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            已完成 ({interviews.filter(i => i.isCompleted).length})
          </button>
        </div>
      </div>

      {/* 面试列表 */}
      <div className="neumorphic-card">
        {filteredInterviews.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {filteredInterviews.map((interview) => (
              <div key={interview.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0">
                        <UserIcon className="w-8 h-8 text-gray-400" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-medium text-gray-900 mb-1">
                          {interview.application.user.name}
                        </h3>
                        <div className="space-y-1">
                          <p className="text-sm text-gray-600">
                            {interview.application.grade} | {interview.application.major}
                          </p>
                          <p className="text-sm text-gray-500">
                            📧 {interview.application.user.email}
                          </p>
                          <p className="text-sm text-gray-500">
                            📱 {interview.application.phone}
                          </p>
                        </div>
                        
                        {interview.isCompleted && interview.score && (
                          <div className="mt-2">
                            <span className="text-sm font-medium text-gray-700">
                              评分: {interview.score}/100
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end space-y-2">
                    <div className="text-right">
                      <div className="flex items-center text-sm text-gray-900 mb-1">
                        <CalendarDaysIcon className="w-4 h-4 text-gray-400 mr-1" />
                        {format(new Date(interview.scheduledAt), 'MM月dd日', { locale: zhCN })}
                      </div>
                      <div className="flex items-center text-sm text-gray-600 mb-1">
                        <ClockIcon className="w-4 h-4 text-gray-400 mr-1" />
                        {format(new Date(interview.scheduledAt), 'HH:mm', { locale: zhCN })}
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <BuildingOfficeIcon className="w-4 h-4 text-gray-400 mr-1" />
                        {interview.room.name}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {getResultBadge(interview)}
                      
                      <Link
                        to={`/interviewer/interviews/${interview.id}`}
                        className="inline-flex items-center px-3 py-1 bg-primary-100 text-primary-700 rounded text-sm hover:bg-primary-200 transition-colors"
                      >
                        <EyeIcon className="w-4 h-4 mr-1" />
                        {interview.isCompleted ? '查看详情' : '开始面试'}
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <CalendarDaysIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">
              {filter === 'all' ? '暂无面试安排' : 
               filter === 'pending' ? '暂无待面试' : '暂无已完成的面试'}
            </p>
            {filter === 'all' && interviews.length === 0 && (
              <div className="text-sm text-gray-400 space-y-2">
                <p>可能的原因：</p>
                <p>• 您还没有被分配到任何面试</p>
                <p>• 管理员还没有创建教室并分配您为面试官</p>
                <p>• 还没有申请者的面试被安排到您负责的教室</p>
                <p className="mt-4 text-primary-600">请联系管理员确认面试官分配状态</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyInterviews;