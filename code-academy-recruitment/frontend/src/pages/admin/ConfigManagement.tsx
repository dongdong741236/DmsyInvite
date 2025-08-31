import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import api from '../../services/api';
import { 
  CogIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  CalendarIcon,
  AcademicCapIcon,
} from '@heroicons/react/24/outline';

interface ConfigItem {
  id: string;
  key: string;
  value: string;
  description?: string;
}

interface RecruitmentConfig {
  freshmanEnabled: boolean;
  sophomoreEnabled: boolean;
  deadline: string;
  startTime: string;
  maxApplications: number;
}

const ConfigManagement: React.FC = () => {
  const [configs, setConfigs] = useState<ConfigItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<RecruitmentConfig>();

  useEffect(() => {
    loadConfigs();
  }, []);

  const loadConfigs = async () => {
    try {
      const [configsResponse, statusResponse] = await Promise.all([
        api.get<ConfigItem[]>('/admin/configs'),
        api.get('/admin/recruitment-status'),
      ]);

      setConfigs(configsResponse.data);
      
      // 设置表单默认值
      const status = statusResponse.data;
      setValue('freshmanEnabled', status.freshmanEnabled);
      setValue('sophomoreEnabled', status.sophomoreEnabled);
      setValue('deadline', status.deadline ? new Date(status.deadline).toISOString().slice(0, 16) : '');
      setValue('startTime', status.startTime ? new Date(status.startTime).toISOString().slice(0, 16) : '');
      setValue('maxApplications', status.maxApplications || 1);
    } catch (error) {
      console.error('Failed to load configs:', error);
      setError('加载配置失败');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: RecruitmentConfig) => {
    try {
      setError('');
      setMessage('');
      setSaving(true);

      const configUpdates = [
        {
          key: 'recruitment.freshman.enabled',
          value: data.freshmanEnabled.toString(),
          description: '是否开启大一学生纳新',
        },
        {
          key: 'recruitment.sophomore.enabled',
          value: data.sophomoreEnabled.toString(),
          description: '是否开启大二学生纳新',
        },
        {
          key: 'recruitment.application.deadline',
          value: data.deadline ? new Date(data.deadline).toISOString() : '',
          description: '申请截止时间',
        },
        {
          key: 'recruitment.application.start_time',
          value: data.startTime ? new Date(data.startTime).toISOString() : '',
          description: '申请开始时间',
        },
        {
          key: 'recruitment.max_applications_per_user',
          value: data.maxApplications.toString(),
          description: '每个用户最大申请数量',
        },
      ];

      await api.put('/admin/configs', { configs: configUpdates });
      setMessage('配置保存成功');
      
      // 重新加载配置
      await loadConfigs();
    } catch (err: any) {
      setError(err.response?.data?.error || '保存配置失败');
    } finally {
      setSaving(false);
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
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center mb-8">
        <CogIcon className="w-8 h-8 text-primary-600 mr-3" />
        <h1 className="text-3xl font-bold">系统配置</h1>
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

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* 纳新开关 */}
        <div className="neumorphic-card">
          <div className="flex items-center mb-6">
            <AcademicCapIcon className="w-6 h-6 text-primary-600 mr-2" />
            <h2 className="text-xl font-semibold">纳新开关</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                <input
                  {...register('freshmanEnabled')}
                  type="checkbox"
                  className="mr-3 h-4 w-4 text-primary-600"
                />
                <div>
                  <p className="font-medium">大一学生纳新</p>
                  <p className="text-sm text-gray-500">允许大一学生提交申请</p>
                </div>
              </label>
            </div>

            <div>
              <label className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                <input
                  {...register('sophomoreEnabled')}
                  type="checkbox"
                  className="mr-3 h-4 w-4 text-primary-600"
                />
                <div>
                  <p className="font-medium">大二学生纳新</p>
                  <p className="text-sm text-gray-500">允许大二学生提交申请</p>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* 时间设置 */}
        <div className="neumorphic-card">
          <div className="flex items-center mb-6">
            <CalendarIcon className="w-6 h-6 text-primary-600 mr-2" />
            <h2 className="text-xl font-semibold">时间设置</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                申请开始时间
              </label>
              <input
                {...register('startTime')}
                type="datetime-local"
                className="neumorphic-input"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                申请截止时间
              </label>
              <input
                {...register('deadline')}
                type="datetime-local"
                className="neumorphic-input"
              />
            </div>
          </div>
        </div>

        {/* 其他设置 */}
        <div className="neumorphic-card">
          <h2 className="text-xl font-semibold mb-6">其他设置</h2>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              每人最大申请数量
            </label>
            <input
              {...register('maxApplications', {
                required: '请设置最大申请数量',
                min: { value: 1, message: '最少为1个' },
                max: { value: 5, message: '最多为5个' },
                valueAsNumber: true,
              })}
              type="number"
              min="1"
              max="5"
              className="neumorphic-input w-32"
            />
            {errors.maxApplications && (
              <p className="mt-1 text-sm text-red-600">{errors.maxApplications.message}</p>
            )}
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="neumorphic-button bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? '保存中...' : '保存配置'}
          </button>
        </div>
      </form>

      {/* 当前配置状态 */}
      <div className="mt-8 neumorphic-card">
        <h3 className="text-lg font-semibold mb-4">当前配置状态</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {configs.map((config) => (
            <div key={config.id} className="p-3 bg-gray-50 rounded-lg">
              <p className="font-medium text-sm">{config.description || config.key}</p>
              <p className="text-gray-600 text-xs mt-1">
                {config.key}: {config.value}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ConfigManagement;