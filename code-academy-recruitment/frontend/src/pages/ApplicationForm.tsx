import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { applicationService } from '../services/application.service';
import { ApplicationFormData } from '../types';
import { ExclamationCircleIcon } from '@heroicons/react/24/outline';

const ApplicationForm: React.FC = () => {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ApplicationFormData>();

  const onSubmit = async (data: ApplicationFormData) => {
    try {
      setError('');
      setLoading(true);
      await applicationService.createApplication(data);
      navigate('/applications');
    } catch (err: any) {
      setError(err.response?.data?.error || '提交失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">提交申请</h1>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
          <ExclamationCircleIcon className="w-5 h-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
          <p className="text-red-800">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        <div className="neumorphic-card">
          <h2 className="text-xl font-semibold mb-6">基本信息</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                学号 <span className="text-red-500">*</span>
              </label>
              <input
                {...register('studentId', {
                  required: '请输入学号',
                  pattern: {
                    value: /^\d{8,12}$/,
                    message: '请输入有效的学号（8-12位数字）',
                  },
                })}
                type="text"
                className="neumorphic-input"
                placeholder="20210001"
              />
              {errors.studentId && (
                <p className="mt-1 text-sm text-red-600">{errors.studentId.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                手机号 <span className="text-red-500">*</span>
              </label>
              <input
                {...register('phone', {
                  required: '请输入手机号',
                  pattern: {
                    value: /^1[3-9]\d{9}$/,
                    message: '请输入有效的手机号',
                  },
                })}
                type="tel"
                className="neumorphic-input"
                placeholder="13800138000"
              />
              {errors.phone && (
                <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                专业 <span className="text-red-500">*</span>
              </label>
              <input
                {...register('major', {
                  required: '请输入专业',
                })}
                type="text"
                className="neumorphic-input"
                placeholder="计算机科学与技术"
              />
              {errors.major && (
                <p className="mt-1 text-sm text-red-600">{errors.major.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                年级 <span className="text-red-500">*</span>
              </label>
              <select
                {...register('grade', {
                  required: '请选择年级',
                })}
                className="neumorphic-input"
              >
                <option value="">请选择</option>
                <option value="大一">大一</option>
                <option value="大二">大二</option>
                <option value="大三">大三</option>
                <option value="大四">大四</option>
                <option value="研一">研一</option>
                <option value="研二">研二</option>
                <option value="研三">研三</option>
              </select>
              {errors.grade && (
                <p className="mt-1 text-sm text-red-600">{errors.grade.message}</p>
              )}
            </div>
          </div>
        </div>

        <div className="neumorphic-card">
          <h2 className="text-xl font-semibold mb-6">个人介绍</h2>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                自我介绍 <span className="text-red-500">*</span>
              </label>
              <textarea
                {...register('introduction', {
                  required: '请输入自我介绍',
                  minLength: {
                    value: 50,
                    message: '自我介绍至少需要50个字符',
                  },
                })}
                rows={4}
                className="neumorphic-input"
                placeholder="请介绍一下自己，包括性格特点、兴趣爱好等..."
              />
              {errors.introduction && (
                <p className="mt-1 text-sm text-red-600">{errors.introduction.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                技能特长 <span className="text-red-500">*</span>
              </label>
              <textarea
                {...register('skills', {
                  required: '请输入技能特长',
                })}
                rows={3}
                className="neumorphic-input"
                placeholder="请列举您掌握的编程语言、框架、工具等..."
              />
              {errors.skills && (
                <p className="mt-1 text-sm text-red-600">{errors.skills.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                项目经验 <span className="text-red-500">*</span>
              </label>
              <textarea
                {...register('experience', {
                  required: '请输入项目经验',
                })}
                rows={4}
                className="neumorphic-input"
                placeholder="请介绍您参与过的项目、比赛或实践经历..."
              />
              {errors.experience && (
                <p className="mt-1 text-sm text-red-600">{errors.experience.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                加入动机 <span className="text-red-500">*</span>
              </label>
              <textarea
                {...register('motivation', {
                  required: '请输入加入动机',
                  minLength: {
                    value: 50,
                    message: '加入动机至少需要50个字符',
                  },
                })}
                rows={4}
                className="neumorphic-input"
                placeholder="请说明您为什么想加入代码书院，以及您的期望和目标..."
              />
              {errors.motivation && (
                <p className="mt-1 text-sm text-red-600">{errors.motivation.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                作品链接（选填）
              </label>
              <input
                {...register('portfolio')}
                type="url"
                className="neumorphic-input"
                placeholder="GitHub、个人网站或其他作品展示链接"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate('/applications')}
            className="neumorphic-button text-gray-600"
          >
            取消
          </button>
          <button
            type="submit"
            disabled={loading}
            className="neumorphic-button bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '提交中...' : '提交申请'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ApplicationForm;