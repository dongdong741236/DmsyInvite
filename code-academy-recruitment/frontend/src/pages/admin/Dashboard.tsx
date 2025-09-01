import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  UserGroupIcon,
  DocumentTextIcon,
  CalendarIcon,
  CheckCircleIcon,
  ChartBarIcon,
  ClockIcon,
  CogIcon,
  BuildingOfficeIcon,
  EnvelopeIcon,
  QuestionMarkCircleIcon,
  CalendarDaysIcon,
} from '@heroicons/react/24/outline';
import api from '../../services/api';

interface DashboardStats {
  totalApplications: number;
  pendingApplications: number;
  scheduledInterviews: number;
  completedInterviews: number;
  acceptedApplications: number;
  totalUsers: number;
}

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await api.get<DashboardStats>('/admin/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Failed to load stats:', error);
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

  const statCards = [
    {
      title: '总申请数',
      value: stats?.totalApplications || 0,
      icon: DocumentTextIcon,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: '待审核',
      value: stats?.pendingApplications || 0,
      icon: ClockIcon,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
    },
    {
      title: '已安排面试',
      value: stats?.scheduledInterviews || 0,
      icon: CalendarIcon,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      title: '已完成面试',
      value: stats?.completedInterviews || 0,
      icon: CheckCircleIcon,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100',
    },
    {
      title: '已录取',
      value: stats?.acceptedApplications || 0,
      icon: ChartBarIcon,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: '注册用户',
      value: stats?.totalUsers || 0,
      icon: UserGroupIcon,
      color: 'text-gray-600',
      bgColor: 'bg-gray-100',
    },
  ];

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">管理后台</h1>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="neumorphic-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">{stat.title}</p>
                  <p className="text-3xl font-bold mt-2">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                  <Icon className={`w-8 h-8 ${stat.color}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 快速操作 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <Link
          to="/admin/applications"
          className="neumorphic-card hover:shadow-neumorphic-hover text-center py-8"
        >
          <DocumentTextIcon className="w-12 h-12 text-primary-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold">申请管理</h3>
          <p className="text-gray-600 mt-2">查看和处理申请</p>
        </Link>

        <Link
          to="/admin/interviews"
          className="neumorphic-card hover:shadow-neumorphic-hover text-center py-8"
        >
          <CalendarIcon className="w-12 h-12 text-primary-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold">面试管理</h3>
          <p className="text-gray-600 mt-2">安排和管理面试</p>
        </Link>

        <Link
          to="/admin/rooms"
          className="neumorphic-card hover:shadow-neumorphic-hover text-center py-8"
        >
          <BuildingOfficeIcon className="w-12 h-12 text-primary-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold">教室管理</h3>
          <p className="text-gray-600 mt-2">管理面试教室</p>
        </Link>

        <Link
          to="/admin/users"
          className="neumorphic-card hover:shadow-neumorphic-hover text-center py-8"
        >
          <UserGroupIcon className="w-12 h-12 text-primary-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold">用户管理</h3>
          <p className="text-gray-600 mt-2">查看注册用户</p>
        </Link>

        <Link
          to="/admin/config"
          className="neumorphic-card hover:shadow-neumorphic-hover text-center py-8"
        >
          <CogIcon className="w-12 h-12 text-primary-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold">系统配置</h3>
          <p className="text-gray-600 mt-2">纳新开关和时间设置</p>
        </Link>

        <Link
          to="/admin/email-templates"
          className="neumorphic-card hover:shadow-neumorphic-hover text-center py-8"
        >
          <EnvelopeIcon className="w-12 h-12 text-primary-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold">邮件模板</h3>
          <p className="text-gray-600 mt-2">管理邮件通知模板</p>
        </Link>

        <Link
          to="/admin/questions"
          className="neumorphic-card hover:shadow-neumorphic-hover text-center py-8"
        >
          <QuestionMarkCircleIcon className="w-12 h-12 text-primary-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold">面试问题</h3>
          <p className="text-gray-600 mt-2">管理面试问题模板</p>
        </Link>

        <Link
          to="/admin/years"
          className="neumorphic-card hover:shadow-neumorphic-hover text-center py-8"
        >
          <CalendarDaysIcon className="w-12 h-12 text-primary-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold">年度管理</h3>
          <p className="text-gray-600 mt-2">管理招新年度设置</p>
        </Link>
      </div>
    </div>
  );
};

export default AdminDashboard;