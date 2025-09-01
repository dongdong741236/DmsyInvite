import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import api from '../../services/api';
import { InterviewRoom } from '../../types';
import {
  BuildingOfficeIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';

interface RoomFormData {
  name: string;
  location: string;
  interviewerIds: string[];
}

const RoomManagement: React.FC = () => {
  const [rooms, setRooms] = useState<InterviewRoom[]>([]);
  const [interviewers, setInterviewers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingRoom, setEditingRoom] = useState<InterviewRoom | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    control,
    formState: { errors },
  } = useForm<RoomFormData>({
    defaultValues: {
      interviewerIds: [],
    },
  });

  useEffect(() => {
    loadRooms();
    loadInterviewers();
  }, []);

  const loadInterviewers = async () => {
    try {
      const response = await api.get('/admin/interviewers/active');
      setInterviewers(response.data);
    } catch (error) {
      console.error('Failed to load interviewers:', error);
    }
  };

  const loadRooms = async () => {
    try {
      setLoading(true);
      const response = await api.get<InterviewRoom[]>('/admin/rooms');
      setRooms(response.data);
    } catch (error) {
      console.error('Failed to load rooms:', error);
      setError('加载教室列表失败');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: RoomFormData) => {
    try {
      setError('');
      setMessage('');

      if (editingRoom) {
        await api.put(`/admin/rooms/${editingRoom.id}`, data);
        setMessage('教室更新成功');
      } else {
        await api.post('/admin/rooms', data);
        setMessage('教室创建成功');
      }

      setShowForm(false);
      setEditingRoom(null);
      reset();
      loadRooms();
    } catch (err: any) {
      setError(err.response?.data?.error || '操作失败');
    }
  };

  const handleEdit = (room: InterviewRoom) => {
    setEditingRoom(room);
    setValue('name', room.name);
    setValue('location', room.location);
    setValue('interviewerIds', room.interviewers?.map(i => i.id) || []);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('确定要删除这个教室吗？')) {
      return;
    }

    try {
      await api.delete(`/admin/rooms/${id}`);
      setMessage('教室删除成功');
      loadRooms();
    } catch (err: any) {
      setError(err.response?.data?.error || '删除失败');
    }
  };

  const handleAddNew = () => {
    setEditingRoom(null);
    reset({
      name: '',
      location: '',
      interviewerIds: [],
    });
    setShowForm(true);
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
          <BuildingOfficeIcon className="w-8 h-8 text-primary-600 mr-3" />
          <h1 className="text-3xl font-bold">教室管理</h1>
        </div>
        <button
          onClick={handleAddNew}
          className="neumorphic-button bg-primary-600 text-white hover:bg-primary-700 flex items-center"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          添加教室
        </button>
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

      {/* 教室表单 */}
      {showForm && (
        <div className="neumorphic-card mb-6">
          <h2 className="text-xl font-semibold mb-4">
            {editingRoom ? '编辑教室' : '添加教室'}
          </h2>
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  教室名称 <span className="text-red-500">*</span>
                </label>
                <input
                  {...register('name', { required: '请输入教室名称' })}
                  type="text"
                  className="neumorphic-input"
                  placeholder="会议室A"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  教室位置 <span className="text-red-500">*</span>
                </label>
                <input
                  {...register('location', { required: '请输入教室位置' })}
                  type="text"
                  className="neumorphic-input"
                  placeholder="教学楼3楼301室"
                />
                {errors.location && (
                  <p className="mt-1 text-sm text-red-600">{errors.location.message}</p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  分配面试官
                </label>
                <Controller
                  name="interviewerIds"
                  control={control}
                  render={({ field: { value, onChange } }) => (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-32 overflow-y-auto border border-gray-300 rounded-lg p-3">
                      {interviewers.map((interviewer) => (
                        <label key={interviewer.id} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={value?.includes(interviewer.id) || false}
                            onChange={(e) => {
                              const currentValue = value || [];
                              if (e.target.checked) {
                                onChange([...currentValue, interviewer.id]);
                              } else {
                                onChange(currentValue.filter((id: string) => id !== interviewer.id));
                              }
                            }}
                            className="mr-2"
                          />
                          <span className="text-sm">
                            {interviewer.name}
                            {interviewer.title && ` (${interviewer.title})`}
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                />
                <p className="mt-1 text-sm text-gray-500">选择在此教室进行面试的面试官</p>
              </div>
            </div>

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingRoom(null);
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
                {editingRoom ? '更新' : '创建'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 教室列表 */}
      <div className="neumorphic-card">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  教室名称
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  位置
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  面试官
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  状态
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {rooms.map((room) => (
                <tr key={room.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {room.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {room.location}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {room.interviewers?.length || 0} 位面试官
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {room.isActive ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        可用
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        禁用
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex flex-wrap gap-1">
                      <button
                        onClick={() => handleEdit(room)}
                        className="inline-flex items-center px-2 py-1 bg-primary-100 text-primary-700 rounded text-xs hover:bg-primary-200 transition-colors"
                      >
                        <PencilIcon className="w-3 h-3 mr-1" />
                        编辑
                      </button>
                      <button
                        onClick={() => handleDelete(room.id)}
                        className="inline-flex items-center px-2 py-1 bg-red-100 text-red-700 rounded text-xs hover:bg-red-200 transition-colors"
                      >
                        <TrashIcon className="w-3 h-3 mr-1" />
                        删除
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {rooms.length === 0 && (
          <div className="text-center py-12">
            <BuildingOfficeIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">暂无教室</p>
            <button
              onClick={handleAddNew}
              className="mt-4 neumorphic-button bg-primary-600 text-white hover:bg-primary-700"
            >
              添加第一个教室
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default RoomManagement;