import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { applicationService } from '../services/application.service';
import { Application } from '../types';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import InterviewScheduleCard from '../components/InterviewScheduleCard';
import {
  PlusIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline';

const ApplicationList: React.FC = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    try {
      const data = await applicationService.getMyApplications();
      setApplications(data);
    } catch (error) {
      console.error('Failed to load applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: Application['status']) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: ClockIcon, text: '待审核' },
      reviewing: { color: 'bg-blue-100 text-blue-800', icon: ClockIcon, text: '审核中' },
      interview_scheduled: { color: 'bg-purple-100 text-purple-800', icon: CalendarIcon, text: '已安排面试' },
      interviewed: { color: 'bg-indigo-100 text-indigo-800', icon: CheckCircleIcon, text: '已面试' },
      accepted: { color: 'bg-green-100 text-green-800', icon: CheckCircleIcon, text: '已录取' },
      rejected: { color: 'bg-red-100 text-red-800', icon: XCircleIcon, text: '未通过' },
    };

    const config = statusConfig[status];
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
        <Icon className="w-4 h-4 mr-1" />
        {config.text}
      </span>
    );
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
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">我的申请</h1>
        {applications.length === 0 && (
          <Link
            to="/applications/new"
            className="neumorphic-button bg-primary-600 text-white hover:bg-primary-700 flex items-center"
          >
            <PlusIcon className="w-5 h-5 mr-2" />
            提交申请
          </Link>
        )}
      </div>

      {/* 面试安排卡片 */}
      <div className="mb-8">
        <InterviewScheduleCard />
      </div>

      {applications.length === 0 ? (
        <div className="neumorphic-card text-center py-12">
          <p className="text-gray-600 mb-6">您还没有提交过申请</p>
          <Link
            to="/applications/new"
            className="neumorphic-button bg-primary-600 text-white hover:bg-primary-700 inline-flex items-center"
          >
            <PlusIcon className="w-5 h-5 mr-2" />
            立即申请
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {applications.map((application) => (
            <Link
              key={application.id}
              to={`/applications/${application.id}`}
              className="block neumorphic-card hover:shadow-neumorphic-hover"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-semibold mb-2">
                    {application.major} - {application.grade}
                  </h3>
                  <p className="text-gray-600 mb-2">学号：{application.studentId}</p>
                  <p className="text-sm text-gray-500">
                    提交时间：{format(new Date(application.createdAt), 'yyyy年MM月dd日 HH:mm', { locale: zhCN })}
                  </p>
                  
                  {application.interview && application.interview.scheduledAt && (
                    <div className="mt-3 p-3 bg-primary-50 rounded-lg">
                      <p className="text-sm font-medium text-primary-800">
                        面试时间：{format(new Date(application.interview.scheduledAt), 'yyyy年MM月dd日 HH:mm', { locale: zhCN })}
                      </p>
                      <p className="text-sm text-primary-700">
                        地点：{application.interview.room.name} - {application.interview.room.location}
                      </p>
                    </div>
                  )}
                </div>
                
                <div className="flex-shrink-0">
                  {getStatusBadge(application.status)}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default ApplicationList;