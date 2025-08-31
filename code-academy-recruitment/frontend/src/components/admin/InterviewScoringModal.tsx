import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { Interview } from '../../types';
import api from '../../services/api';
import {
  XMarkIcon,
  StarIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

interface InterviewScoringModalProps {
  interview: Interview | null;
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

interface ScoringFormData {
  technical: number;
  communication: number;
  teamwork: number;
  motivation: number;
  overall: number;
  interviewerNotes: string;
  result: 'passed' | 'failed';
}

const InterviewScoringModal: React.FC<InterviewScoringModalProps> = ({
  interview,
  isOpen,
  onClose,
  onSaved,
}) => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    reset,
  } = useForm<ScoringFormData>({
    defaultValues: {
      technical: interview?.evaluationScores?.technical || 0,
      communication: interview?.evaluationScores?.communication || 0,
      teamwork: interview?.evaluationScores?.teamwork || 0,
      motivation: interview?.evaluationScores?.motivation || 0,
      overall: interview?.evaluationScores?.overall || 0,
      interviewerNotes: interview?.interviewerNotes || '',
      result: (interview?.result === 'pending' ? 'passed' : interview?.result) || 'passed',
    },
  });

  const watchedScores = watch(['technical', 'communication', 'teamwork', 'motivation']);

  // 自动计算总分
  React.useEffect(() => {
    const [tech, comm, team, motiv] = watchedScores;
    const average = (tech + comm + team + motiv) / 4;
    // 这里可以添加自动设置overall分数的逻辑
  }, [watchedScores]);

  const onSubmit = async (data: ScoringFormData) => {
    if (!interview) return;

    try {
      setLoading(true);
      setError('');
      setMessage('');

      await api.put(`/admin/interviews/${interview.id}/evaluation`, {
        evaluationScores: {
          technical: data.technical,
          communication: data.communication,
          teamwork: data.teamwork,
          motivation: data.motivation,
          overall: data.overall,
        },
        interviewerNotes: data.interviewerNotes,
        result: data.result,
        isCompleted: true,
      });

      setMessage('面试评分保存成功');
      onSaved();
      setTimeout(() => {
        onClose();
        reset();
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.error || '保存失败');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !interview) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold flex items-center">
            <StarIcon className="w-6 h-6 mr-2 text-primary-600" />
            面试评分
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          {/* 面试信息 */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium mb-2">面试信息</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">申请人：</span>
                <span className="font-medium">{interview.application?.user?.name}</span>
              </div>
              <div>
                <span className="text-gray-600">专业年级：</span>
                <span>{interview.application?.major} - {interview.application?.grade}</span>
              </div>
              <div>
                <span className="text-gray-600">面试时间：</span>
                <span>{format(new Date(interview.scheduledAt), 'yyyy-MM-dd HH:mm', { locale: zhCN })}</span>
              </div>
              <div>
                <span className="text-gray-600">面试地点：</span>
                <span>{interview.room.name} ({interview.room.location})</span>
              </div>
            </div>
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
            {/* 评分项目 */}
            <div>
              <h3 className="font-medium mb-4">评分项目 (1-10分)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    技术能力 <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register('technical', {
                      required: '请评分技术能力',
                      min: { value: 1, message: '最低1分' },
                      max: { value: 10, message: '最高10分' },
                      valueAsNumber: true,
                    })}
                    type="number"
                    min="1"
                    max="10"
                    className="neumorphic-input"
                  />
                  {errors.technical && (
                    <p className="mt-1 text-sm text-red-600">{errors.technical.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    沟通表达 <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register('communication', {
                      required: '请评分沟通表达',
                      min: { value: 1, message: '最低1分' },
                      max: { value: 10, message: '最高10分' },
                      valueAsNumber: true,
                    })}
                    type="number"
                    min="1"
                    max="10"
                    className="neumorphic-input"
                  />
                  {errors.communication && (
                    <p className="mt-1 text-sm text-red-600">{errors.communication.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    团队协作 <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register('teamwork', {
                      required: '请评分团队协作',
                      min: { value: 1, message: '最低1分' },
                      max: { value: 10, message: '最高10分' },
                      valueAsNumber: true,
                    })}
                    type="number"
                    min="1"
                    max="10"
                    className="neumorphic-input"
                  />
                  {errors.teamwork && (
                    <p className="mt-1 text-sm text-red-600">{errors.teamwork.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    学习动机 <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register('motivation', {
                      required: '请评分学习动机',
                      min: { value: 1, message: '最低1分' },
                      max: { value: 10, message: '最高10分' },
                      valueAsNumber: true,
                    })}
                    type="number"
                    min="1"
                    max="10"
                    className="neumorphic-input"
                  />
                  {errors.motivation && (
                    <p className="mt-1 text-sm text-red-600">{errors.motivation.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* 综合评分 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                综合评分 <span className="text-red-500">*</span>
              </label>
              <input
                {...register('overall', {
                  required: '请给出综合评分',
                  min: { value: 1, message: '最低1分' },
                  max: { value: 10, message: '最高10分' },
                  valueAsNumber: true,
                })}
                type="number"
                min="1"
                max="10"
                className="neumorphic-input"
              />
              {errors.overall && (
                <p className="mt-1 text-sm text-red-600">{errors.overall.message}</p>
              )}
            </div>

            {/* 面试备注 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                面试备注
              </label>
              <textarea
                {...register('interviewerNotes')}
                rows={4}
                className="neumorphic-input"
                placeholder="记录面试过程中的观察和评价..."
              />
            </div>

            {/* 面试结果 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                面试结果 <span className="text-red-500">*</span>
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    {...register('result', { required: '请选择面试结果' })}
                    type="radio"
                    value="passed"
                    className="mr-2"
                  />
                  通过
                </label>
                <label className="flex items-center">
                  <input
                    {...register('result', { required: '请选择面试结果' })}
                    type="radio"
                    value="failed"
                    className="mr-2"
                  />
                  未通过
                </label>
              </div>
              {errors.result && (
                <p className="mt-1 text-sm text-red-600">{errors.result.message}</p>
              )}
            </div>

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={onClose}
                className="neumorphic-button text-gray-600"
                disabled={loading}
              >
                取消
              </button>
              <button
                type="submit"
                className="neumorphic-button bg-primary-600 text-white hover:bg-primary-700"
                disabled={loading}
              >
                {loading ? '保存中...' : '保存评分'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default InterviewScoringModal;