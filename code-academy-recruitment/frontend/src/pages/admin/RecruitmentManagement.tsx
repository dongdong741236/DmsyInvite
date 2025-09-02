import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import api from '../../services/api';
import {
  CogIcon,
  CalendarDaysIcon,
  PlusIcon,
  CheckCircleIcon,
  ArchiveBoxIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  EnvelopeIcon,
  UserGroupIcon,
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
  recruitmentConfig?: RecruitmentConfig;
}

interface RecruitmentConfig {
  freshmanApplicationOpen: boolean;
  sophomoreApplicationOpen: boolean;
  freshmanDeadline?: string;
  sophomoreDeadline?: string;
  allowedEmailDomains: string[];
  maxApplicationsPerUser: number;
  requireEmailVerification: boolean;
  defaultInterviewDuration: number;
  enableBatchInterview: boolean;
  autoSendNotifications: boolean;
  notificationEmailFrom: string;
}

interface YearFormData {
  year: number;
  name: string;
  description?: string;
  startDate?: string;
  endDate?: string;
}

interface ConfigFormData extends RecruitmentConfig {
  allowedEmailDomainsString: string;
}

const RecruitmentManagement: React.FC = () => {
  const [years, setYears] = useState<RecruitmentYear[]>([]);
  const [currentYear, setCurrentYear] = useState<RecruitmentYear | null>(null);
  const [loading, setLoading] = useState(true);
  const [showYearForm, setShowYearForm] = useState(false);
  const [showConfigForm, setShowConfigForm] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const {
    register: registerYear,
    handleSubmit: handleSubmitYear,
    reset: resetYear,
    formState: { errors: yearErrors },
  } = useForm<YearFormData>();

  const {
    register: registerConfig,
    handleSubmit: handleSubmitConfig,
    reset: resetConfig,
    setValue: setConfigValue,
    formState: { errors: configErrors },
  } = useForm<ConfigFormData>();

  useEffect(() => {
    loadYears();
  }, []);

  const loadYears = async () => {
    try {
      setLoading(true);
      const response = await api.get<RecruitmentYear[]>('/admin/recruitment-years');
      setYears(response.data);
      
      const active = response.data.find(year => year.isActive);
      setCurrentYear(active || null);
      
      if (active?.recruitmentConfig) {
        populateConfigForm(active.recruitmentConfig);
      }
    } catch (error) {
      console.error('Failed to load years:', error);
      setError('加载年度数据失败');
    } finally {
      setLoading(false);
    }
  };

  const populateConfigForm = (config: RecruitmentConfig) => {
    setConfigValue('freshmanApplicationOpen', config.freshmanApplicationOpen);
    setConfigValue('sophomoreApplicationOpen', config.sophomoreApplicationOpen);
    setConfigValue('freshmanDeadline', config.freshmanDeadline || '');
    setConfigValue('sophomoreDeadline', config.sophomoreDeadline || '');
    setConfigValue('allowedEmailDomainsString', config.allowedEmailDomains.join(', '));
    setConfigValue('maxApplicationsPerUser', config.maxApplicationsPerUser);
    setConfigValue('requireEmailVerification', config.requireEmailVerification);
    setConfigValue('defaultInterviewDuration', config.defaultInterviewDuration);
    setConfigValue('enableBatchInterview', config.enableBatchInterview);
    setConfigValue('autoSendNotifications', config.autoSendNotifications);
    setConfigValue('notificationEmailFrom', config.notificationEmailFrom);
  };

  const onSubmitYear = async (data: YearFormData) => {
    try {
      setError('');
      setMessage('');

      await api.post('/admin/recruitment-years', data);
      setMessage('招新年度创建成功');
      setShowYearForm(false);
      resetYear();
      loadYears();
    } catch (err: any) {
      setError(err.response?.data?.error || '创建年度失败');
    }
  };

  const onSubmitConfig = async (data: ConfigFormData) => {
    if (!currentYear) {
      setError('请先选择一个活跃的招新年度');
      return;
    }

    try {
      setError('');
      setMessage('');

      const configData = {
        ...data,
        allowedEmailDomains: data.allowedEmailDomainsString
          .split(',')
          .map(domain => domain.trim())
          .filter(domain => domain.length > 0),
      };
      delete (configData as any).allowedEmailDomainsString;

      // 更新当前年度的配置
      await api.put(`/admin/recruitment-years/${currentYear.id}/config`, {
        recruitmentConfig: configData,
      });

      setMessage('招新配置更新成功');
      setShowConfigForm(false);
      loadYears();
    } catch (err: any) {
      setError(err.response?.data?.error || '更新配置失败');
    }
  };

  const activateYear = async (yearId: string) => {
    try {
      await api.put(`/admin/recruitment-years/${yearId}/activate`);
      setMessage('年度激活成功');
      loadYears();
    } catch (err: any) {
      setError(err.response?.data?.error || '激活年度失败');
    }
  };

  const archiveYear = async (yearId: string, yearName: string) => {
    if (!window.confirm(`确定要归档年度"${yearName}"吗？归档后将无法修改。`)) {
      return;
    }

    try {
      await api.put(`/admin/recruitment-years/${yearId}/archive`);
      setMessage('年度归档成功');
      loadYears();
    } catch (err: any) {
      setError(err.response?.data?.error || '归档年度失败');
    }
  };

  const handleConfigEdit = () => {
    if (!currentYear?.recruitmentConfig) {
      setError('当前年度没有配置信息');
      return;
    }
    populateConfigForm(currentYear.recruitmentConfig);
    setShowConfigForm(true);
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
          <h1 className="text-3xl font-bold">招新管理</h1>
        </div>
        <div className="flex space-x-4">
          <button
            onClick={() => setShowYearForm(true)}
            className="neumorphic-button bg-primary-600 text-white hover:bg-primary-700 flex items-center"
          >
            <PlusIcon className="w-5 h-5 mr-2" />
            新建年度
          </button>
          {currentYear && (
            <button
              onClick={handleConfigEdit}
              className="neumorphic-button bg-green-600 text-white hover:bg-green-700 flex items-center"
            >
              <CogIcon className="w-5 h-5 mr-2" />
              配置管理
            </button>
          )}
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
          <ExclamationTriangleIcon className="w-5 h-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* 当前活跃年度配置概览 */}
      {currentYear && (
        <div className="neumorphic-card mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">当前活跃年度</h2>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
              <CheckCircleIcon className="w-4 h-4 mr-1" />
              活跃中
            </span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium mb-3">{currentYear.name}</h3>
              <p className="text-gray-600 mb-4">{currentYear.description}</p>
              
              <div className="space-y-2">
                <div className="flex items-center text-sm">
                  <CalendarDaysIcon className="w-4 h-4 text-gray-400 mr-2" />
                  <span>开始: {currentYear.startDate ? new Date(currentYear.startDate).toLocaleDateString() : '未设置'}</span>
                </div>
                <div className="flex items-center text-sm">
                  <CalendarDaysIcon className="w-4 h-4 text-gray-400 mr-2" />
                  <span>结束: {currentYear.endDate ? new Date(currentYear.endDate).toLocaleDateString() : '未设置'}</span>
                </div>
              </div>
            </div>
            
            {currentYear.recruitmentConfig && (
              <div>
                <h4 className="font-medium mb-3">当前配置</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center">
                    <UserGroupIcon className="w-4 h-4 text-gray-400 mr-2" />
                    <span>大一申请: {currentYear.recruitmentConfig.freshmanApplicationOpen ? '开放' : '关闭'}</span>
                  </div>
                  <div className="flex items-center">
                    <UserGroupIcon className="w-4 h-4 text-gray-400 mr-2" />
                    <span>大二申请: {currentYear.recruitmentConfig.sophomoreApplicationOpen ? '开放' : '关闭'}</span>
                  </div>
                  <div className="flex items-center">
                    <ClockIcon className="w-4 h-4 text-gray-400 mr-2" />
                    <span>面试时长: {currentYear.recruitmentConfig.defaultInterviewDuration}分钟</span>
                  </div>
                  <div className="flex items-center">
                    <EnvelopeIcon className="w-4 h-4 text-gray-400 mr-2" />
                    <span>邮件验证: {currentYear.recruitmentConfig.requireEmailVerification ? '启用' : '禁用'}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 年度创建表单 */}
      {showYearForm && (
        <div className="neumorphic-card mb-6">
          <h2 className="text-xl font-semibold mb-4">创建新年度</h2>
          
          <form onSubmit={handleSubmitYear(onSubmitYear)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  年度 <span className="text-red-500">*</span>
                </label>
                <input
                  {...registerYear('year', { 
                    required: '请输入年度',
                    min: { value: 2020, message: '年度不能小于2020' },
                    max: { value: 2030, message: '年度不能大于2030' },
                  })}
                  type="number"
                  className="neumorphic-input"
                  placeholder="2024"
                />
                {yearErrors.year && (
                  <p className="mt-1 text-sm text-red-600">{yearErrors.year.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  年度名称 <span className="text-red-500">*</span>
                </label>
                <input
                  {...registerYear('name', { required: '请输入年度名称' })}
                  type="text"
                  className="neumorphic-input"
                  placeholder="2024年秋季招新"
                />
                {yearErrors.name && (
                  <p className="mt-1 text-sm text-red-600">{yearErrors.name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  开始日期
                </label>
                <input
                  {...registerYear('startDate')}
                  type="date"
                  className="neumorphic-input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  结束日期
                </label>
                <input
                  {...registerYear('endDate')}
                  type="date"
                  className="neumorphic-input"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  年度描述
                </label>
                <textarea
                  {...registerYear('description')}
                  className="neumorphic-input"
                  rows={3}
                  placeholder="2024年代码书院实验室秋季招新"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => {
                  setShowYearForm(false);
                  resetYear();
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

      {/* 配置表单 */}
      {showConfigForm && currentYear && (
        <div className="neumorphic-card mb-6">
          <h2 className="text-xl font-semibold mb-4">招新配置 - {currentYear.name}</h2>
          
          <form onSubmit={handleSubmitConfig(onSubmitConfig)} className="space-y-6">
            {/* 申请开放设置 */}
            <div>
              <h3 className="text-lg font-medium mb-4">申请开放设置</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center">
                  <input
                    {...registerConfig('freshmanApplicationOpen')}
                    type="checkbox"
                    className="mr-2"
                  />
                  <label className="text-sm font-medium text-gray-700">开放大一学生申请</label>
                </div>
                <div className="flex items-center">
                  <input
                    {...registerConfig('sophomoreApplicationOpen')}
                    type="checkbox"
                    className="mr-2"
                  />
                  <label className="text-sm font-medium text-gray-700">开放大二学生申请</label>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    大一申请截止时间
                  </label>
                  <input
                    {...registerConfig('freshmanDeadline')}
                    type="datetime-local"
                    className="neumorphic-input"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    大二申请截止时间
                  </label>
                  <input
                    {...registerConfig('sophomoreDeadline')}
                    type="datetime-local"
                    className="neumorphic-input"
                  />
                </div>
              </div>
            </div>

            {/* 邮箱和验证设置 */}
            <div>
              <h3 className="text-lg font-medium mb-4">邮箱和验证设置</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    允许的邮箱域名 <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...registerConfig('allowedEmailDomainsString', { required: '请输入邮箱域名' })}
                    type="text"
                    className="neumorphic-input"
                    placeholder="mails.cust.edu.cn, stu.cust.edu.cn"
                  />
                  <p className="mt-1 text-sm text-gray-500">多个域名用逗号分隔</p>
                  {configErrors.allowedEmailDomainsString && (
                    <p className="mt-1 text-sm text-red-600">{configErrors.allowedEmailDomainsString.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    每用户最大申请数
                  </label>
                  <input
                    {...registerConfig('maxApplicationsPerUser', { 
                      min: { value: 1, message: '最少允许1个申请' },
                      max: { value: 5, message: '最多允许5个申请' },
                    })}
                    type="number"
                    className="neumorphic-input"
                    min="1"
                    max="5"
                  />
                  {configErrors.maxApplicationsPerUser && (
                    <p className="mt-1 text-sm text-red-600">{configErrors.maxApplicationsPerUser.message}</p>
                  )}
                </div>

                <div className="flex items-center">
                  <input
                    {...registerConfig('requireEmailVerification')}
                    type="checkbox"
                    className="mr-2"
                  />
                  <label className="text-sm font-medium text-gray-700">需要邮箱验证</label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    通知邮箱地址
                  </label>
                  <input
                    {...registerConfig('notificationEmailFrom')}
                    type="email"
                    className="neumorphic-input"
                    placeholder="noreply@cust.edu.cn"
                  />
                </div>
              </div>
            </div>

            {/* 面试设置 */}
            <div>
              <h3 className="text-lg font-medium mb-4">面试设置</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    默认面试时长（分钟）
                  </label>
                  <input
                    {...registerConfig('defaultInterviewDuration', { 
                      min: { value: 15, message: '面试时长不能少于15分钟' },
                      max: { value: 120, message: '面试时长不能超过120分钟' },
                    })}
                    type="number"
                    className="neumorphic-input"
                    min="15"
                    max="120"
                  />
                  {configErrors.defaultInterviewDuration && (
                    <p className="mt-1 text-sm text-red-600">{configErrors.defaultInterviewDuration.message}</p>
                  )}
                </div>

                <div className="flex items-center">
                  <input
                    {...registerConfig('enableBatchInterview')}
                    type="checkbox"
                    className="mr-2"
                  />
                  <label className="text-sm font-medium text-gray-700">启用批量面试安排</label>
                </div>

                <div className="flex items-center">
                  <input
                    {...registerConfig('autoSendNotifications')}
                    type="checkbox"
                    className="mr-2"
                  />
                  <label className="text-sm font-medium text-gray-700">自动发送通知邮件</label>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => {
                  setShowConfigForm(false);
                  resetConfig();
                }}
                className="neumorphic-button text-gray-600"
              >
                取消
              </button>
              <button
                type="submit"
                className="neumorphic-button bg-green-600 text-white hover:bg-green-700"
              >
                保存配置
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 年度列表 */}
      <div className="neumorphic-card">
        <h2 className="text-xl font-semibold mb-4">所有招新年度</h2>
        
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
                      <div className="text-sm font-medium text-gray-900">{year.name}</div>
                      <div className="text-sm text-gray-500">{year.description}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {year.startDate ? new Date(year.startDate).toLocaleDateString() : '未设置'}
                    </div>
                    <div className="text-sm text-gray-500">
                      至 {year.endDate ? new Date(year.endDate).toLocaleDateString() : '未设置'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col space-y-1">
                      {year.isActive && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          活跃中
                        </span>
                      )}
                      {year.isArchived && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          已归档
                        </span>
                      )}
                      {!year.isActive && !year.isArchived && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          待激活
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-4">
                    <div className="flex flex-col sm:flex-row gap-1">
                      {!year.isActive && !year.isArchived && (
                        <button
                          onClick={() => activateYear(year.id)}
                          className="inline-flex items-center justify-center px-2 py-1 bg-green-100 text-green-700 rounded text-xs hover:bg-green-200 transition-colors"
                        >
                          <CheckCircleIcon className="w-3 h-3 sm:mr-1" />
                          <span className="hidden sm:inline">激活</span>
                        </button>
                      )}
                      {!year.isArchived && (
                        <button
                          onClick={() => archiveYear(year.id, year.name)}
                          className="inline-flex items-center justify-center px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs hover:bg-gray-200 transition-colors"
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
              onClick={() => setShowYearForm(true)}
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

export default RecruitmentManagement;