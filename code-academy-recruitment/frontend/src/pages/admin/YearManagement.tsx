import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import api from '../../services/api';
import {
  CalendarDaysIcon,
  PlusIcon,
  CheckCircleIcon,
  ArchiveBoxIcon,
  ExclamationTriangleIcon,
  StarIcon,
} from '@heroicons/react/24/outline';

interface RecruitmentYear {
  id: string;
  year: number;
  name: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  isActive: boolean;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

interface YearFormData {
  year: number;
  name: string;
  description?: string;
  startDate?: string;
  endDate?: string;
}

const YearManagement: React.FC = () => {
  const [years, setYears] = useState<RecruitmentYear[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<YearFormData>({
    defaultValues: {
      year: new Date().getFullYear() + 1,
    },
  });

  useEffect(() => {
    loadYears();
  }, []);

  const loadYears = async () => {
    try {
      setLoading(true);
      const response = await api.get<RecruitmentYear[]>('/admin/recruitment-years');
      setYears(response.data);
    } catch (error) {
      console.error('Failed to load years:', error);
      setError('加载招新年度失败');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: YearFormData) => {
    try {
      setError('');
      setMessage('');

      await api.post('/admin/recruitment-years', data);
      setMessage('招新年度创建成功');
      setShowForm(false);
      reset();
      loadYears();
    } catch (err: any) {
      setError(err.response?.data?.error || '创建失败');
    }
  };

  const handleActivate = async (yearId: string, yearName: string) => {
    if (!window.confirm(`确定要激活"${yearName}"吗？这将停用其他年度。`)) {
      return;
    }

    try {
      await api.put(`/admin/recruitment-years/${yearId}/activate`);
      setMessage('年度激活成功');
      loadYears();
    } catch (err: any) {
      setError(err.response?.data?.error || '激活失败');
    }
  };

  const handleArchive = async (yearId: string, yearName: string) => {
    if (!window.confirm(`确定要归档"${yearName}"吗？归档后将无法修改。`)) {
      return;
    }

    try {
      await api.put(`/admin/recruitment-years/${yearId}/archive`);
      setMessage('年度归档成功');
      loadYears();
    } catch (err: any) {
      setError(err.response?.data?.error || '归档失败');
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
          <h1 className="text-3xl font-bold">招新年度管理</h1>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="neumorphic-button bg-primary-600 text-white hover:bg-primary-700 flex items-center"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          新建年度
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

      {/* 年度创建表单 */}
      {showForm && (
        <div className="neumorphic-card mb-6">
          <h2 className="text-xl font-semibold mb-4">创建新招新年度</h2>
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  招新年度 <span className="text-red-500">*</span>
                </label>
                <input
                  {...register('year', { 
                    required: '请输入招新年度',
                    min: { value: 2020, message: '年度不能早于2020年' },
                    max: { value: 2030, message: '年度不能晚于2030年' },
                    valueAsNumber: true
                  })}
                  type="number"
                  min="2020"
                  max="2030"
                  className="neumorphic-input"
                  placeholder="2025"
                />
                {errors.year && (
                  <p className="mt-1 text-sm text-red-600">{errors.year.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  年度名称 <span className="text-red-500">*</span>
                </label>
                <input
                  {...register('name', { required: '请输入年度名称' })}
                  type="text"
                  className="neumorphic-input"
                  placeholder="2025年春季招新"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  开始日期
                </label>
                <input
                  {...register('startDate')}
                  type="date"
                  className="neumorphic-input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  结束日期
                </label>
                <input
                  {...register('endDate')}
                  type="date"
                  className="neumorphic-input"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  年度描述
                </label>
                <textarea
                  {...register('description')}
                  rows={3}
                  className="neumorphic-input"
                  placeholder="招新年度的描述信息..."
                />
              </div>
            </div>

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
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
                创建年度
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 年度列表 */}
      <div className="neumorphic-card">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  年度信息
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  时间范围
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
              {years.map((year) => (
                <tr key={year.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900 flex items-center">
                        {year.isActive && (
                          <StarIcon className="w-4 h-4 text-yellow-500 mr-2" />
                        )}
                        {year.year}年 - {year.name}
                      </div>
                      {year.description && (
                        <div className="text-sm text-gray-500">{year.description}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {year.startDate && year.endDate ? (
                      <div>
                        <div>{format(new Date(year.startDate), 'yyyy-MM-dd', { locale: zhCN })}</div>
                        <div>至 {format(new Date(year.endDate), 'yyyy-MM-dd', { locale: zhCN })}</div>
                      </div>
                    ) : (
                      <span className="text-gray-400">未设置</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="space-y-1">
                      {year.isActive && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          当前活跃
                        </span>
                      )}
                      {year.isArchived && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          已归档
                        </span>
                      )}
                      {!year.isActive && !year.isArchived && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          待激活
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-4">
                    <div className="flex flex-col sm:flex-row gap-1">
                      {!year.isActive && !year.isArchived && (
                        <button
                          onClick={() => handleActivate(year.id, year.name)}
                          className="inline-flex items-center justify-center px-2 py-1 bg-green-100 text-green-700 rounded text-xs hover:bg-green-200 transition-colors"
                        >
                          <CheckCircleIcon className="w-3 h-3 sm:mr-1" />
                          <span className="hidden sm:inline">激活</span>
                        </button>
                      )}
                      
                      {!year.isArchived && (
                        <button
                          onClick={() => handleArchive(year.id, year.name)}
                          className="inline-flex items-center justify-center px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs hover:bg-yellow-200 transition-colors"
                        >
                          <ArchiveBoxIcon className="w-3 h-3 sm:mr-1" />
                          <span className="hidden sm:inline">归档</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {years.length === 0 && (
          <div className="text-center py-12">
            <CalendarDaysIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">暂无招新年度</p>
            <button
              onClick={() => setShowForm(true)}
              className="mt-4 neumorphic-button bg-primary-600 text-white hover:bg-primary-700"
            >
              创建第一个年度
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default YearManagement;