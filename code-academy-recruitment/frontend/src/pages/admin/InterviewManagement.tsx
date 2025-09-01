import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { useForm } from 'react-hook-form';
import api from '../../services/api';
import { Interview, InterviewRoom, Application } from '../../types';
import InterviewScoringModal from '../../components/admin/InterviewScoringModal';
import BatchInterviewModal from '../../components/admin/BatchInterviewModal';
import ResultConfirmationModal from '../../components/admin/ResultConfirmationModal';
import {
  CalendarIcon,
  PlusIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  EnvelopeIcon,
  ExclamationCircleIcon,
  StarIcon,
  UserGroupIcon,
  PaperAirplaneIcon,
  ChatBubbleLeftRightIcon,
} from '@heroicons/react/24/outline';

interface InterviewsResponse {
  interviews: Interview[];
  total: number;
  page: number;
  totalPages: number;
}

interface ScheduleFormData {
  applicationId: string;
  roomId: string;
  scheduledAt: string;
}

const InterviewManagement: React.FC = () => {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [rooms, setRooms] = useState<InterviewRoom[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [selectedInterview, setSelectedInterview] = useState<Interview | null>(null);
  const [showScoringModal, setShowScoringModal] = useState(false);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ScheduleFormData>();

  useEffect(() => {
    loadInterviews();
    loadRooms();
    loadPendingApplications();
  }, [page, selectedDate]);

  const loadInterviews = async () => {
    try {
      setLoading(true);
      const response = await api.get<InterviewsResponse>('/admin/interviews', {
        params: { page, limit: 20, date: selectedDate },
      });
      
      setInterviews(response.data.interviews);
      setTotal(response.data.total);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      console.error('Failed to load interviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRooms = async () => {
    try {
      const response = await api.get<InterviewRoom[]>('/admin/rooms');
      setRooms(response.data.filter(room => room.isActive));
    } catch (error) {
      console.error('Failed to load rooms:', error);
    }
  };

  const loadPendingApplications = async () => {
    try {
      const response = await api.get('/admin/applications', {
        params: { status: 'reviewing', limit: 100 },
      });
      setApplications(response.data.applications || []);
    } catch (error) {
      console.error('Failed to load pending applications:', error);
    }
  };

  const onScheduleSubmit = async (data: ScheduleFormData) => {
    try {
      setError('');
      setMessage('');

      await api.post('/admin/interviews', data);
      setMessage('面试安排成功');
      setShowScheduleForm(false);
      reset();
      loadInterviews();
      loadPendingApplications();
    } catch (err: any) {
      setError(err.response?.data?.error || '安排面试失败');
    }
  };

  const sendNotification = async (interviewId: string) => {
    try {
      await api.post(`/admin/interviews/${interviewId}/notify`);
      setMessage('面试通知已发送');
      loadInterviews();
    } catch (err: any) {
      setError(err.response?.data?.error || '发送通知失败');
    }
  };

  const handleScoring = (interview: Interview) => {
    setSelectedInterview(interview);
    setShowScoringModal(true);
  };

  const handleScoringComplete = () => {
    setMessage('面试评分已保存');
    loadInterviews();
  };

  const getResultBadge = (result: string) => {
    const config = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: ClockIcon, text: '待评分' },
      passed: { color: 'bg-green-100 text-green-800', icon: CheckCircleIcon, text: '通过' },
      failed: { color: 'bg-red-100 text-red-800', icon: XCircleIcon, text: '未通过' },
    };

    const resultConfig = config[result as keyof typeof config];
    if (!resultConfig) return null;
    
    const Icon = resultConfig.icon;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${resultConfig.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {resultConfig.text}
      </span>
    );
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center">
          <CalendarIcon className="w-8 h-8 text-primary-600 mr-3" />
          <h1 className="text-3xl font-bold">面试管理</h1>
        </div>
        <div className="flex space-x-4">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="neumorphic-input"
          />
          <button
            onClick={() => setShowScheduleForm(true)}
            className="neumorphic-button bg-primary-600 text-white hover:bg-primary-700 flex items-center"
          >
            <PlusIcon className="w-5 h-5 mr-2" />
            单个安排
          </button>
          <button
            onClick={() => setShowBatchModal(true)}
            className="neumorphic-button bg-green-600 text-white hover:bg-green-700 flex items-center"
          >
            <UserGroupIcon className="w-5 h-5 mr-2" />
            批量安排
          </button>
          <button
            onClick={() => setShowResultModal(true)}
            className="neumorphic-button bg-purple-600 text-white hover:bg-purple-700 flex items-center"
          >
            <PaperAirplaneIcon className="w-5 h-5 mr-2" />
            发送结果通知
          </button>
        </div>
      </div>

      {message && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start">
          <CheckCircleIcon className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
          <p className="text-green-800">{message}</p>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
          <ExclamationCircleIcon className="w-5 h-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* 安排面试表单 */}
      {showScheduleForm && (
        <div className="neumorphic-card mb-6">
          <h2 className="text-xl font-semibold mb-4">安排面试</h2>
          
          <form onSubmit={handleSubmit(onScheduleSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  选择申请 <span className="text-red-500">*</span>
                </label>
                <select
                  {...register('applicationId', { required: '请选择申请' })}
                  className="neumorphic-input"
                >
                  <option value="">请选择申请</option>
                  {applications.map((app) => (
                    <option key={app.id} value={app.id}>
                      {app.user?.name} - {app.major} - {app.grade}
                    </option>
                  ))}
                </select>
                {errors.applicationId && (
                  <p className="mt-1 text-sm text-red-600">{errors.applicationId.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  选择教室 <span className="text-red-500">*</span>
                </label>
                <select
                  {...register('roomId', { required: '请选择教室' })}
                  className="neumorphic-input"
                >
                  <option value="">请选择教室</option>
                  {rooms.map((room) => (
                    <option key={room.id} value={room.id}>
                      {room.name} - {room.location} (容纳{room.capacity}人)
                    </option>
                  ))}
                </select>
                {errors.roomId && (
                  <p className="mt-1 text-sm text-red-600">{errors.roomId.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  面试时间 <span className="text-red-500">*</span>
                </label>
                <input
                  {...register('scheduledAt', { required: '请选择面试时间' })}
                  type="datetime-local"
                  className="neumorphic-input"
                />
                {errors.scheduledAt && (
                  <p className="mt-1 text-sm text-red-600">{errors.scheduledAt.message}</p>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => {
                  setShowScheduleForm(false);
                  reset();
                }}
                className="neumorphic-button text-gray-600"
              >
                取消
              </button>
              <button
                type="submit"
                className="neumorphic-button bg-primary-600 text-white hover:bg-primary-700"
              >
                安排面试
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 面试列表 */}
      <div className="neumorphic-card">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  申请人
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  面试时间
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  面试地点
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  面试结果
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {interviews.map((interview) => (
                <tr key={interview.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {interview.application?.user?.name || '未知'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {interview.application?.major} - {interview.application?.grade}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {format(new Date(interview.scheduledAt), 'MM-dd HH:mm', { locale: zhCN })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div>{interview.room.name}</div>
                    <div className="text-xs text-gray-400">{interview.room.location}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getResultBadge(interview.result)}
                  </td>
                  <td className="px-3 py-4">
                    <div className="flex flex-col sm:flex-row gap-1">
                      {!interview.notificationSent && (
                        <button
                          onClick={() => sendNotification(interview.id)}
                          className="inline-flex items-center justify-center px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200 transition-colors min-w-0"
                        >
                          <EnvelopeIcon className="w-3 h-3 sm:mr-1" />
                          <span className="hidden sm:inline">通知</span>
                        </button>
                      )}
                      <button
                        onClick={() => window.open(`/admin/interviews/${interview.id}/panel`, '_blank')}
                        className="inline-flex items-center justify-center px-2 py-1 bg-green-100 text-green-700 rounded text-xs hover:bg-green-200 transition-colors min-w-0"
                      >
                        <ChatBubbleLeftRightIcon className="w-3 h-3 sm:mr-1" />
                        <span className="hidden sm:inline">面试</span>
                      </button>
                      
                      <button
                        onClick={() => handleScoring(interview)}
                        className="inline-flex items-center justify-center px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs hover:bg-purple-200 transition-colors min-w-0"
                      >
                        <StarIcon className="w-3 h-3 sm:mr-1" />
                        <span className="hidden sm:inline">评分</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 分页 */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-3 bg-gray-50">
            <div className="text-sm text-gray-700">
              第 {page} 页，共 {totalPages} 页，总计 {total} 个面试
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page <= 1}
                className="neumorphic-button disabled:opacity-50 disabled:cursor-not-allowed"
              >
                上一页
              </button>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page >= totalPages}
                className="neumorphic-button disabled:opacity-50 disabled:cursor-not-allowed"
              >
                下一页
              </button>
            </div>
          </div>
        )}

        {interviews.length === 0 && (
          <div className="text-center py-12">
            <CalendarIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">暂无面试安排</p>
            <button
              onClick={() => setShowScheduleForm(true)}
              className="mt-4 neumorphic-button bg-primary-600 text-white hover:bg-primary-700"
            >
              安排第一个面试
            </button>
          </div>
        )}
      </div>

      {/* 面试评分模态框 */}
      <InterviewScoringModal
        interview={selectedInterview}
        isOpen={showScoringModal}
        onClose={() => {
          setShowScoringModal(false);
          setSelectedInterview(null);
        }}
        onSaved={handleScoringComplete}
      />

      {/* 批量安排面试模态框 */}
      <BatchInterviewModal
        isOpen={showBatchModal}
        onClose={() => setShowBatchModal(false)}
        onSuccess={() => {
          setMessage('批量面试安排成功');
          loadInterviews();
        }}
      />

      {/* 面试结果确认模态框 */}
      <ResultConfirmationModal
        isOpen={showResultModal}
        onClose={() => setShowResultModal(false)}
        onComplete={() => {
          setMessage('面试结果通知已发送');
          loadInterviews();
        }}
      />
    </div>
  );
};

export default InterviewManagement;