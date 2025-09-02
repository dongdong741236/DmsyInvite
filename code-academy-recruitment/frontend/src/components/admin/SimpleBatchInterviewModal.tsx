import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import api from '../../services/api';
import { Application, InterviewRoom } from '../../types';
import {
  XMarkIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';

interface SimpleBatchInterviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface BatchInterviewFormData {
  roomId: string;
  interviewDate: string;
  startTime: string;
  intervalMinutes: number; // 面试间隔（分钟）
}

const SimpleBatchInterviewModal: React.FC<SimpleBatchInterviewModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [rooms, setRooms] = useState<InterviewRoom[]>([]);
  const [selectedApplications, setSelectedApplications] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<BatchInterviewFormData>({
    defaultValues: {
      startTime: '09:00',
      intervalMinutes: 30,
    },
  });

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const loadData = async () => {
    try {
      const [appsResponse, roomsResponse] = await Promise.all([
        api.get('/admin/applications', { params: { status: 'approved', limit: 100 } }),
        api.get('/admin/rooms'),
      ]);

      setApplications(appsResponse.data.applications || []);
      setRooms(roomsResponse.data.filter((room: InterviewRoom) => room.isActive));
    } catch (error) {
      console.error('Failed to load data:', error);
      setError('加载数据失败');
    }
  };

  const handleApplicationToggle = (appId: string) => {
    setSelectedApplications(prev => {
      if (prev.includes(appId)) {
        return prev.filter(id => id !== appId);
      } else {
        return [...prev, appId];
      }
    });
    setError('');
  };

  const onSubmit = async (data: BatchInterviewFormData) => {
    if (selectedApplications.length === 0) {
      setError('请选择要安排面试的申请');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setMessage('');

      // 为每个选择的申请生成面试时间
      const interviews = selectedApplications.map((appId, index) => {
        const baseDateTime = new Date(`${data.interviewDate}T${data.startTime}:00`);
        const scheduledTime = new Date(baseDateTime.getTime() + index * data.intervalMinutes * 60 * 1000);
        
        return {
          applicationId: appId,
          roomId: data.roomId,
          scheduledAt: scheduledTime.toISOString(),
        };
      });

      await api.post('/admin/interviews/batch', { interviews });

      setMessage(`成功安排 ${interviews.length} 个面试`);
      onSuccess();
      handleClose();
    } catch (err: any) {
      setError(err.response?.data?.error || '批量安排面试失败');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    reset();
    setSelectedApplications([]);
    setMessage('');
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold flex items-center">
            <UserGroupIcon className="w-6 h-6 mr-2 text-primary-600" />
            批量安排面试
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {message && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start">
            <CheckCircleIcon className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
            <p className="text-green-800">{message}</p>
          </div>
        )}

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
            <ExclamationTriangleIcon className="w-5 h-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
            <p className="text-red-800">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* 面试设置 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                面试教室 <span className="text-red-500">*</span>
              </label>
              <select
                {...register('roomId', { required: '请选择教室' })}
                className="neumorphic-input"
              >
                <option value="">请选择教室</option>
                {rooms.map((room) => (
                  <option key={room.id} value={room.id}>
                    {room.name} - {room.location}
                  </option>
                ))}
              </select>
              {errors.roomId && (
                <p className="mt-1 text-sm text-red-600">{errors.roomId.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                面试日期 <span className="text-red-500">*</span>
              </label>
              <input
                {...register('interviewDate', { required: '请选择面试日期' })}
                type="date"
                className="neumorphic-input"
              />
              {errors.interviewDate && (
                <p className="mt-1 text-sm text-red-600">{errors.interviewDate.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                开始时间 <span className="text-red-500">*</span>
              </label>
              <input
                {...register('startTime', { required: '请选择开始时间' })}
                type="time"
                className="neumorphic-input"
              />
              {errors.startTime && (
                <p className="mt-1 text-sm text-red-600">{errors.startTime.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                面试间隔（分钟）
              </label>
              <input
                {...register('intervalMinutes', { 
                  min: { value: 15, message: '面试间隔至少15分钟' },
                  max: { value: 120, message: '面试间隔不超过120分钟' },
                })}
                type="number"
                min="15"
                max="120"
                className="neumorphic-input"
              />
              {errors.intervalMinutes && (
                <p className="mt-1 text-sm text-red-600">{errors.intervalMinutes.message}</p>
              )}
            </div>
          </div>

          {/* 申请选择 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-4">
              选择申请 ({selectedApplications.length} 个已选择)
            </label>
            
            {applications.length > 0 ? (
              <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg">
                {applications.map((application) => (
                  <div
                    key={application.id}
                    className={`flex items-center p-3 border-b border-gray-100 hover:bg-gray-50 ${
                      selectedApplications.includes(application.id) ? 'bg-blue-50' : ''
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedApplications.includes(application.id)}
                      onChange={() => handleApplicationToggle(application.id)}
                      className="mr-3"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{application.user?.name}</div>
                      <div className="text-sm text-gray-600">
                        {application.major} - {application.grade} | 学号：{application.studentId}
                        {application.campusCardId && ` | 一卡通：${application.campusCardId}`}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                暂无可安排面试的申请（需要"审核通过"状态）
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={loading || selectedApplications.length === 0}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '安排中...' : `安排 ${selectedApplications.length} 个面试`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SimpleBatchInterviewModal;