import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import {
  ClipboardDocumentListIcon,
  CalendarDaysIcon,
  UserGroupIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';

interface DashboardStats {
  totalInterviews: number;
  todayInterviews: number;
  completedInterviews: number;
  pendingInterviews: number;
}

interface Interview {
  id: string;
  scheduledTime: string;
  application: {
    id: string;
    user: {
      name: string;
      email: string;
    };
    grade: string;
    major: string;
  };
  room: {
    name: string;
    location: string;
  };
  isCompleted: boolean;
  result?: string;
}

const InterviewerDashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalInterviews: 0,
    todayInterviews: 0,
    completedInterviews: 0,
    pendingInterviews: 0,
  });
  const [todayInterviews, setTodayInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      console.log('=== 面试官仪表板加载数据 ===');
      
      // 获取面试官的面试统计
      const statsResponse = await api.get('/interviewer/stats');
      console.log('面试官统计数据:', statsResponse.data);
      setStats(statsResponse.data);

      // 获取今天的面试安排
      const todayResponse = await api.get('/interviewer/interviews/today');
      console.log('今日面试数据:', todayResponse.data);
      setTodayInterviews(todayResponse.data);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      console.error('面试官仪表板API错误:', error);
    } finally {
      setLoading(false);
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
      {/* 欢迎信息 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          欢迎回来，{user?.name}！
        </h1>
        <p className="text-gray-600">
          {user?.title && `${user.title} | `}
          {user?.department || '代码书院实验室'}
        </p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="neumorphic-card p-6">
          <div className="flex items-center">
            <ClipboardDocumentListIcon className="w-8 h-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900">{stats.totalInterviews}</p>
              <p className="text-gray-600">总面试数</p>
            </div>
          </div>
        </div>

        <div className="neumorphic-card p-6">
          <div className="flex items-center">
            <CalendarDaysIcon className="w-8 h-8 text-green-600" />
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900">{stats.todayInterviews}</p>
              <p className="text-gray-600">今日面试</p>
            </div>
          </div>
        </div>

        <div className="neumorphic-card p-6">
          <div className="flex items-center">
            <CheckCircleIcon className="w-8 h-8 text-green-600" />
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900">{stats.completedInterviews}</p>
              <p className="text-gray-600">已完成</p>
            </div>
          </div>
        </div>

        <div className="neumorphic-card p-6">
          <div className="flex items-center">
            <ClockIcon className="w-8 h-8 text-yellow-600" />
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900">{stats.pendingInterviews}</p>
              <p className="text-gray-600">待面试</p>
            </div>
          </div>
        </div>
      </div>

      {/* 今日面试安排 */}
      <div className="neumorphic-card mb-8">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold">今日面试安排</h2>
        </div>
        
        {todayInterviews.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {todayInterviews.map((interview) => (
              <div key={interview.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <UserGroupIcon className="w-6 h-6 text-gray-400" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-medium text-gray-900">
                          {interview.application.user.name}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {interview.application.grade} | {interview.application.major}
                        </p>
                        <p className="text-sm text-gray-500">
                          {interview.application.user.email}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        {new Date(interview.scheduledTime).toLocaleTimeString('zh-CN', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                      <p className="text-sm text-gray-600">
                        {interview.room.name} - {interview.room.location}
                      </p>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {interview.isCompleted ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          已完成
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          待面试
                        </span>
                      )}
                      
                      <Link
                        to={`/interviewer/interviews/${interview.id}`}
                        className="neumorphic-button bg-primary-600 text-white hover:bg-primary-700 text-sm"
                      >
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
            <p className="text-gray-500">今日暂无面试安排</p>
          </div>
        )}
      </div>

      {/* 快捷操作 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link
          to="/interviewer/interviews"
          className="neumorphic-card hover:shadow-neumorphic-hover text-center py-8 block"
        >
          <ClipboardDocumentListIcon className="w-12 h-12 text-primary-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold">我的面试</h3>
          <p className="text-gray-600 mt-2">查看所有分配给我的面试</p>
        </Link>

        <Link
          to="/interviewer/schedule"
          className="neumorphic-card hover:shadow-neumorphic-hover text-center py-8 block"
        >
          <CalendarDaysIcon className="w-12 h-12 text-primary-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold">面试日程</h3>
          <p className="text-gray-600 mt-2">查看面试时间安排</p>
        </Link>

        <Link
          to="/interviewer/questions"
          className="neumorphic-card hover:shadow-neumorphic-hover text-center py-8 block"
        >
          <ExclamationCircleIcon className="w-12 h-12 text-primary-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold">面试题库</h3>
          <p className="text-gray-600 mt-2">查看面试问题模板</p>
        </Link>
      </div>
    </div>
  );
};

export default InterviewerDashboard;