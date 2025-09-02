import React, { useState, useEffect } from 'react';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import api from '../../services/api';
import {
  CalendarDaysIcon,
  ClockIcon,
  UserIcon,
  BuildingOfficeIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
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
  };
  room: {
    name: string;
    location: string;
  };
  isCompleted: boolean;
  result?: string;
}

const InterviewSchedule: React.FC = () => {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentWeek, setCurrentWeek] = useState(new Date());

  useEffect(() => {
    loadInterviews();
  }, []);

  const loadInterviews = async () => {
    try {
      setLoading(true);
      const response = await api.get('/interviewer/interviews');
      setInterviews(response.data);
    } catch (error) {
      console.error('Failed to load interviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 }); // 周一开始
  const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const getInterviewsForDay = (date: Date) => {
    return interviews.filter(interview => 
      isSameDay(new Date(interview.scheduledAt), date)
    ).sort((a, b) => 
      new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
    );
  };

  const goToPreviousWeek = () => {
    setCurrentWeek(prev => new Date(prev.getTime() - 7 * 24 * 60 * 60 * 1000));
  };

  const goToNextWeek = () => {
    setCurrentWeek(prev => new Date(prev.getTime() + 7 * 24 * 60 * 60 * 1000));
  };

  const goToCurrentWeek = () => {
    setCurrentWeek(new Date());
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
          <h1 className="text-3xl font-bold">面试日程</h1>
        </div>
      </div>

      {/* 周导航 */}
      <div className="neumorphic-card p-4 mb-6">
        <div className="flex items-center justify-between">
          <button
            onClick={goToPreviousWeek}
            className="flex items-center px-3 py-1 text-gray-600 hover:text-gray-900"
          >
            <ChevronLeftIcon className="w-5 h-5 mr-1" />
            上一周
          </button>
          
          <div className="text-center">
            <h2 className="text-lg font-semibold">
              {format(weekStart, 'yyyy年MM月dd日', { locale: zhCN })} - {format(weekEnd, 'MM月dd日', { locale: zhCN })}
            </h2>
            <button
              onClick={goToCurrentWeek}
              className="text-sm text-primary-600 hover:text-primary-700"
            >
              回到本周
            </button>
          </div>
          
          <button
            onClick={goToNextWeek}
            className="flex items-center px-3 py-1 text-gray-600 hover:text-gray-900"
          >
            下一周
            <ChevronRightIcon className="w-5 h-5 ml-1" />
          </button>
        </div>
      </div>

      {/* 周视图 */}
      <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
        {weekDays.map((day) => {
          const dayInterviews = getInterviewsForDay(day);
          const isToday = isSameDay(day, new Date());
          
          return (
            <div key={day.toISOString()} className="neumorphic-card">
              <div className={`p-3 border-b border-gray-200 ${isToday ? 'bg-primary-50' : ''}`}>
                <div className="text-center">
                  <div className="text-sm text-gray-600">
                    {format(day, 'EEEE', { locale: zhCN })}
                  </div>
                  <div className={`text-lg font-semibold ${isToday ? 'text-primary-600' : 'text-gray-900'}`}>
                    {format(day, 'dd', { locale: zhCN })}
                  </div>
                </div>
              </div>
              
              <div className="p-3 space-y-2 min-h-[200px]">
                {dayInterviews.length > 0 ? (
                  dayInterviews.map((interview) => (
                    <div
                      key={interview.id}
                      className={`p-2 rounded-lg text-xs border ${
                        interview.isCompleted 
                          ? 'bg-gray-50 border-gray-200' 
                          : 'bg-blue-50 border-blue-200'
                      }`}
                    >
                      <div className="flex items-center mb-1">
                        <ClockIcon className="w-3 h-3 text-gray-400 mr-1" />
                        <span className="font-medium">
                          {format(new Date(interview.scheduledAt), 'HH:mm', { locale: zhCN })}
                        </span>
                      </div>
                      
                      <div className="flex items-center mb-1">
                        <UserIcon className="w-3 h-3 text-gray-400 mr-1" />
                        <span className="truncate">{interview.application.user.name}</span>
                      </div>
                      
                      <div className="flex items-center mb-1">
                        <BuildingOfficeIcon className="w-3 h-3 text-gray-400 mr-1" />
                        <span className="truncate">{interview.room.name}</span>
                      </div>
                      
                      <div className="text-gray-600">
                        {interview.application.grade} | {interview.application.major}
                      </div>
                      
                      {interview.isCompleted && (
                        <div className="mt-1">
                          <span className={`px-1 py-0.5 rounded text-xs ${
                            interview.result === 'passed' 
                              ? 'bg-green-100 text-green-700'
                              : interview.result === 'failed'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                            {interview.result === 'passed' ? '通过' : 
                             interview.result === 'failed' ? '未通过' : '已完成'}
                          </span>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center text-gray-400 text-sm py-8">
                    无面试安排
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 统计信息 */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="neumorphic-card p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">
            {interviews.filter(i => !i.isCompleted).length}
          </div>
          <div className="text-gray-600">待面试</div>
        </div>
        
        <div className="neumorphic-card p-4 text-center">
          <div className="text-2xl font-bold text-green-600">
            {interviews.filter(i => i.isCompleted && i.result === 'passed').length}
          </div>
          <div className="text-gray-600">通过</div>
        </div>
        
        <div className="neumorphic-card p-4 text-center">
          <div className="text-2xl font-bold text-red-600">
            {interviews.filter(i => i.isCompleted && i.result === 'failed').length}
          </div>
          <div className="text-gray-600">未通过</div>
        </div>
      </div>
    </div>
  );
};

export default InterviewSchedule;