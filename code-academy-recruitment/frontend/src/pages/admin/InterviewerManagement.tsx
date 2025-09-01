import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import api from '../../services/api';
import {
  UserGroupIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
} from '@heroicons/react/24/outline';

interface Interviewer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  title?: string;
  department?: string;
  expertise?: string;
  isActive: boolean;
}

interface InterviewerFormData {
  name: string;
  email: string;
  phone?: string;
  title?: string;
  department?: string;
  expertise?: string;
  isActive: boolean;
}

const InterviewerManagement: React.FC = () => {
  const [interviewers, setInterviewers] = useState<Interviewer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingInterviewer, setEditingInterviewer] = useState<Interviewer | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<InterviewerFormData>({
    defaultValues: {
      isActive: true,
    },
  });

  useEffect(() => {
    loadInterviewers();
  }, []);

  const loadInterviewers = async () => {
    try {
      setLoading(true);
      const response = await api.get<Interviewer[]>('/admin/interviewers');
      setInterviewers(response.data);
    } catch (error) {
      console.error('Failed to load interviewers:', error);
      setError('加载面试者失败');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: InterviewerFormData) => {
    try {
      setError('');
      setMessage('');

      if (editingInterviewer) {
        await api.put(`/admin/interviewers/${editingInterviewer.id}`, data);
        setMessage('面试者更新成功');
      } else {
        await api.post('/admin/interviewers', data);
        setMessage('面试者创建成功');
      }

      setShowForm(false);
      setEditingInterviewer(null);
      reset();
      loadInterviewers();
    } catch (err: any) {
      setError(err.response?.data?.error || '操作失败');
    }
  };

  const handleEdit = (interviewer: Interviewer) => {
    setEditingInterviewer(interviewer);
    setValue('name', interviewer.name);
    setValue('email', interviewer.email);
    setValue('phone', interviewer.phone || '');
    setValue('title', interviewer.title || '');
    setValue('department', interviewer.department || '');
    setValue('expertise', interviewer.expertise || '');
    setValue('isActive', interviewer.isActive);
    setShowForm(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`确定要删除面试者"${name}"吗？`)) {
      return;
    }

    try {
      await api.delete(`/admin/interviewers/${id}`);
      setMessage('面试者删除成功');
      loadInterviewers();
    } catch (err: any) {
      setError(err.response?.data?.error || '删除失败');
    }
  };

  const handleAddNew = () => {
    setEditingInterviewer(null);
    reset({
      isActive: true,
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
          <UserGroupIcon className="w-8 h-8 text-primary-600 mr-3" />
          <h1 className="text-3xl font-bold">面试者管理</h1>
        </div>
        <button
          onClick={handleAddNew}
          className="neumorphic-button bg-primary-600 text-white hover:bg-primary-700 flex items-center"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          添加面试者
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
          <ExclamationTriangleIcon className="w-5 h-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* 面试者表单 */}
      {showForm && (
        <div className="neumorphic-card mb-6">
          <h2 className="text-xl font-semibold mb-4">
            {editingInterviewer ? '编辑面试者' : '添加面试者'}
          </h2>
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  姓名 <span className="text-red-500">*</span>
                </label>
                <input
                  {...register('name', { required: '请输入姓名' })}
                  type="text"
                  className="neumorphic-input"
                  placeholder="张学长"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  邮箱 <span className="text-red-500">*</span>
                </label>
                <input
                  {...register('email', { 
                    required: '请输入邮箱',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: '请输入有效的邮箱地址',
                    },
                  })}
                  type="email"
                  className="neumorphic-input"
                  placeholder="zhang@mails.cust.edu.cn"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  手机号
                </label>
                <input
                  {...register('phone')}
                  type="tel"
                  className="neumorphic-input"
                  placeholder="13800138000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  职位/称号
                </label>
                <input
                  {...register('title')}
                  type="text"
                  className="neumorphic-input"
                  placeholder="技术负责人"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  所属部门
                </label>
                <input
                  {...register('department')}
                  type="text"
                  className="neumorphic-input"
                  placeholder="代码书院实验室"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  专业领域
                </label>
                <input
                  {...register('expertise')}
                  type="text"
                  className="neumorphic-input"
                  placeholder="前端开发、算法"
                />
              </div>

              <div className="md:col-span-2">
                <div className="flex items-center">
                  <input
                    {...register('isActive')}
                    type="checkbox"
                    className="mr-2"
                  />
                  <label className="text-sm font-medium text-gray-700">启用此面试者</label>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingInterviewer(null);
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
                {editingInterviewer ? '更新' : '创建'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 面试者列表 */}
      <div className="neumorphic-card">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  面试者信息
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  联系方式
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  职位部门
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
              {interviewers.map((interviewer) => (
                <tr key={interviewer.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <UserIcon className="w-8 h-8 text-gray-400 mr-3" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">{interviewer.name}</div>
                        {interviewer.expertise && (
                          <div className="text-sm text-gray-500">{interviewer.expertise}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="space-y-1">
                      <div className="flex items-center text-sm text-gray-900">
                        <EnvelopeIcon className="w-4 h-4 text-gray-400 mr-2" />
                        {interviewer.email}
                      </div>
                      {interviewer.phone && (
                        <div className="flex items-center text-sm text-gray-500">
                          <PhoneIcon className="w-4 h-4 text-gray-400 mr-2" />
                          {interviewer.phone}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{interviewer.title || '未设置'}</div>
                    <div className="text-sm text-gray-500">{interviewer.department || '未设置'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {interviewer.isActive ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        启用
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        禁用
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-4">
                    <div className="flex flex-col sm:flex-row gap-1">
                      <button
                        onClick={() => handleEdit(interviewer)}
                        className="inline-flex items-center justify-center px-2 py-1 bg-primary-100 text-primary-700 rounded text-xs hover:bg-primary-200 transition-colors"
                      >
                        <PencilIcon className="w-3 h-3 sm:mr-1" />
                        <span className="hidden sm:inline">编辑</span>
                      </button>
                      <button
                        onClick={() => handleDelete(interviewer.id, interviewer.name)}
                        className="inline-flex items-center justify-center px-2 py-1 bg-red-100 text-red-700 rounded text-xs hover:bg-red-200 transition-colors"
                      >
                        <TrashIcon className="w-3 h-3 sm:mr-1" />
                        <span className="hidden sm:inline">删除</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {interviewers.length === 0 && (
          <div className="text-center py-12">
            <UserGroupIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">暂无面试者</p>
            <button
              onClick={handleAddNew}
              className="mt-4 neumorphic-button bg-primary-600 text-white hover:bg-primary-700"
            >
              添加第一个面试者
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default InterviewerManagement;