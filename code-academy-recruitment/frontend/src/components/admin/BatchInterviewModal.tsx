import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import api from '../../services/api';
import { Application, InterviewRoom } from '../../types';
import {
  XMarkIcon,
  CalendarIcon,
  BuildingOfficeIcon,
  UserGroupIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

interface BatchInterviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface BatchInterviewFormData {
  roomId: string;
  interviewDate: string; // 只到天
  morningCount: number; // 上午安排人数
  afternoonCount: number; // 下午安排人数
}

const BatchInterviewModal: React.FC<BatchInterviewModalProps> = ({
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
    watch,
    formState: { errors },
    reset,
  } = useForm<BatchInterviewFormData>({
    defaultValues: {
      morningCount: 5,
      afternoonCount: 5,
    },
  });

  const watchedRoom = watch('roomId');
  const watchedDate = watch('interviewDate');
  const watchedMorningCount = watch('morningCount');
  const watchedAfternoonCount = watch('afternoonCount');

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const loadData = async () => {
    try {
      const [appsResponse, roomsResponse] = await Promise.all([
        api.get('/admin/applications', { params: { status: 'reviewing', limit: 100 } }),
        api.get('/admin/rooms'),
      ]);

      setApplications(appsResponse.data.applications || []);
      setRooms(roomsResponse.data.filter((room: InterviewRoom) => room.isActive));
    } catch (error) {
      console.error('Failed to load data:', error);
      setError('加载数据失败');
    }
  };

  const calculateTimeSlots = () => {
    const morningCount = watchedMorningCount || 0;
    const afternoonCount = watchedAfternoonCount || 0;
    
    const slots = [];
    
    // 上午时间段 (9:00-12:00)
    for (let i = 0; i < morningCount; i++) {
      slots.push({
        period: 'morning',
        time: '09:00-12:00',
        label: `上午第${i + 1}组`,
      });
    }
    
    // 下午时间段 (14:00-17:00)
    for (let i = 0; i < afternoonCount; i++) {
      slots.push({
        period: 'afternoon',
        time: '14:00-17:00',
        label: `下午第${i + 1}组`,
      });
    }
    
    return slots;
  };

  const timeSlots = calculateTimeSlots();
  const maxInterviews = timeSlots.length;

  const handleApplicationToggle = (appId: string) => {
    setSelectedApplications(prev => {
      if (prev.includes(appId)) {
        return prev.filter(id => id !== appId);
      } else {
        if (prev.length >= maxInterviews) {
          setError(`当前时间安排最多只能安排 ${maxInterviews} 个面试`);
          return prev;
        }
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

    if (selectedApplications.length > maxInterviews) {
      setError(`选择的申请数量超过可安排时间段数量（${maxInterviews}个）`);
      return;
    }

    try {
      setLoading(true);
      setError('');
      setMessage('');

      // 为每个选择的申请安排面试时间
      const interviews = selectedApplications.map((appId, index) => {
        const slot = timeSlots[index];
        
        // 根据时间段分配具体时间
        let scheduledTime;
        if (slot.period === 'morning') {
          scheduledTime = '09:00:00'; // 上午统一9点
        } else {
          scheduledTime = '14:00:00'; // 下午统一2点
        }
        
        const scheduledAt = `${data.interviewDate}T${scheduledTime}`;
        
        return {
          applicationId: appId,
          roomId: data.roomId,
          scheduledAt,
        };
      });

      await api.post('/admin/interviews/batch', {
        interviews,
      });

      setMessage(`成功安排 ${interviews.length} 个面试`);
      onSuccess();
      
      setTimeout(() => {
        onClose();
        reset();
        setSelectedApplications([]);
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.error || '批量安排面试失败');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold flex items-center">
            <UserGroupIcon className="w-6 h-6 mr-2 text-primary-600" />
            批量安排面试
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {message && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-start">
              <CheckCircleIcon className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
              <p className="text-green-800">{message}</p>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
              <ExclamationTriangleIcon className="w-5 h-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
              <p className="text-red-800">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* 面试设置 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  面试教室 <span className="text-red-500">*</span>
                </label>
                <select
                  {...register('roomId', { required: '请选择面试教室' })}
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
                  面试日期 <span className="text-red-500">*</span>
                </label>
                <input
                  {...register('interviewDate', { required: '请选择面试日期' })}
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  className="neumorphic-input"
                />
                {errors.interviewDate && (
                  <p className="mt-1 text-sm text-red-600">{errors.interviewDate.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  上午安排人数 <span className="text-red-500">*</span>
                </label>
                <input
                  {...register('morningCount', { 
                    required: '请输入上午安排人数',
                    min: { value: 0, message: '人数不能为负数' },
                    max: { value: 20, message: '上午最多安排20人' },
                    valueAsNumber: true
                  })}
                  type="number"
                  min="0"
                  max="20"
                  className="neumorphic-input"
                  placeholder="5"
                />
                <p className="text-xs text-gray-500 mt-1">上午时间段：09:00-12:00</p>
                {errors.morningCount && (
                  <p className="mt-1 text-sm text-red-600">{errors.morningCount.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  下午安排人数 <span className="text-red-500">*</span>
                </label>
                <input
                  {...register('afternoonCount', { 
                    required: '请输入下午安排人数',
                    min: { value: 0, message: '人数不能为负数' },
                    max: { value: 20, message: '下午最多安排20人' },
                    valueAsNumber: true
                  })}
                  type="number"
                  min="0"
                  max="20"
                  className="neumorphic-input"
                  placeholder="5"
                />
                <p className="text-xs text-gray-500 mt-1">下午时间段：14:00-17:00</p>
                {errors.afternoonCount && (
                  <p className="mt-1 text-sm text-red-600">{errors.afternoonCount.message}</p>
                )}
              </div>
            </div>

            {/* 时间段预览 */}
            {(watchedMorningCount > 0 || watchedAfternoonCount > 0) && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-medium mb-2 flex items-center">
                  <ClockIcon className="w-5 h-5 mr-2 text-blue-600" />
                  面试安排预览 (共{maxInterviews}个名额)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {watchedMorningCount > 0 && (
                    <div className="bg-white p-3 rounded border">
                      <div className="font-medium text-green-700">上午时间段</div>
                      <div className="text-sm text-gray-600">09:00-12:00</div>
                      <div className="text-sm">安排 {watchedMorningCount} 人</div>
                    </div>
                  )}
                  {watchedAfternoonCount > 0 && (
                    <div className="bg-white p-3 rounded border">
                      <div className="font-medium text-blue-700">下午时间段</div>
                      <div className="text-sm text-gray-600">14:00-17:00</div>
                      <div className="text-sm">安排 {watchedAfternoonCount} 人</div>
                    </div>
                  )}
                </div>
                <p className="text-sm text-blue-600 mt-2">
                  请选择 {maxInterviews} 个申请进行安排
                </p>
              </div>
            )}

            {/* 申请选择 */}
            <div>
              <h3 className="font-medium mb-4 flex items-center">
                <UserGroupIcon className="w-5 h-5 mr-2 text-primary-600" />
                选择申请 ({selectedApplications.length}/{maxInterviews})
              </h3>
              
              {applications.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  暂无待安排面试的申请
                </div>
              ) : (
                <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg">
                  {applications.map((app) => (
                    <div
                      key={app.id}
                      className={`flex items-center p-3 border-b border-gray-100 hover:bg-gray-50 ${
                        selectedApplications.includes(app.id) ? 'bg-primary-50 border-primary-200' : ''
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedApplications.includes(app.id)}
                        onChange={() => handleApplicationToggle(app.id)}
                        className="mr-3"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">
                          {app.user?.name || '未知'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {app.major} - {app.grade} | 学号：{app.studentId}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 安排预览 */}
            {selectedApplications.length > 0 && timeSlots.length > 0 && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium mb-3">安排预览</h3>
                <div className="space-y-2">
                  {selectedApplications.slice(0, maxInterviews).map((appId, index) => {
                    const app = applications.find(a => a.id === appId);
                    const slot = timeSlots[index];
                    
                    return (
                      <div key={appId} className="flex items-center justify-between bg-white p-2 rounded text-sm">
                        <span>{app?.user?.name} ({app?.major})</span>
                        <span className={`px-2 py-1 rounded text-xs ${
                          slot?.period === 'morning' 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {watchedDate} {slot?.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  reset();
                  setSelectedApplications([]);
                }}
                className="neumorphic-button text-gray-600"
                disabled={loading}
              >
                取消
              </button>
              <button
                type="submit"
                className="neumorphic-button bg-primary-600 text-white hover:bg-primary-700"
                disabled={loading || selectedApplications.length === 0}
              >
                {loading ? '安排中...' : `安排 ${selectedApplications.length} 个面试`}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BatchInterviewModal;