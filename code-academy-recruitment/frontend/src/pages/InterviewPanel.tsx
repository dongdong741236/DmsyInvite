import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { Application, Interview } from '../types';
import FileViewer from '../components/FileViewer';
import {
  DocumentTextIcon,
  StarIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowLeftIcon,
  QuestionMarkCircleIcon,
  ChatBubbleLeftRightIcon,
} from '@heroicons/react/24/outline';

interface InterviewQuestion {
  id: string;
  question: string;
  category: 'technical' | 'behavioral' | 'motivation' | 'general';
  description?: string;
}

interface InterviewFormData {
  technical: number;
  communication: number;
  teamwork: number;
  motivation: number;
  overall: number;
  interviewerNotes: string;
  result: 'passed' | 'failed';
  questionAnswers: {
    questionId: string;
    question: string;
    answer: string;
    score?: number;
  }[];
}

const InterviewPanel: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [interview, setInterview] = useState<Interview | null>(null);
  const [application, setApplication] = useState<Application | null>(null);
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<InterviewFormData>({
    defaultValues: {
      technical: 0,
      communication: 0,
      teamwork: 0,
      motivation: 0,
      overall: 0,
      interviewerNotes: '',
      result: 'passed',
      questionAnswers: [],
    },
  });

  useEffect(() => {
    if (id) {
      loadInterviewData(id);
      loadQuestions();
    }
  }, [id]);

  const loadInterviewData = async (interviewId: string) => {
    try {
      setLoading(true);
      
      // 根据用户角色选择不同的API
      const apiUrl = user?.role === 'interviewer' 
        ? `/interviewer/interviews/${interviewId}`
        : `/admin/interviews/${interviewId}`;
      
      console.log('加载面试数据, 用户角色:', user?.role, 'API:', apiUrl);
      const response = await api.get<Interview>(apiUrl);
      const interviewData = response.data;
      
      setInterview(interviewData);
      setApplication(interviewData.application!);

      // 填充现有数据
      if (interviewData.evaluationScores) {
        setValue('technical', interviewData.evaluationScores.technical || 0);
        setValue('communication', interviewData.evaluationScores.communication || 0);
        setValue('teamwork', interviewData.evaluationScores.teamwork || 0);
        setValue('motivation', interviewData.evaluationScores.motivation || 0);
        setValue('overall', interviewData.evaluationScores.overall || 0);
      }
      
      if (interviewData.interviewerNotes) {
        setValue('interviewerNotes', interviewData.interviewerNotes);
      }
      
      if (interviewData.result !== 'pending') {
        setValue('result', interviewData.result);
      }

      if (interviewData.questionAnswers) {
        setValue('questionAnswers', interviewData.questionAnswers);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || '获取面试信息失败');
    } finally {
      setLoading(false);
    }
  };

  const loadQuestions = async () => {
    try {
      const response = await api.get<InterviewQuestion[]>('/admin/interview-questions');
      setQuestions(response.data);
      
      // 初始化问题回答
      const initialAnswers = response.data.map(q => ({
        questionId: q.id,
        question: q.question,
        answer: '',
        score: 0,
      }));
      setValue('questionAnswers', initialAnswers);
    } catch (error) {
      console.error('Failed to load questions:', error);
    }
  };

  const onSubmit = async (data: InterviewFormData) => {
    if (!interview) return;

    try {
      setSaving(true);
      setError('');
      setMessage('');

      // 根据用户角色选择不同的API
      const apiUrl = user?.role === 'interviewer' 
        ? `/interviewer/interviews/${interview.id}/evaluation`
        : `/admin/interviews/${interview.id}/evaluation`;
      
      await api.put(apiUrl, {
        evaluationScores: {
          technical: data.technical,
          communication: data.communication,
          teamwork: data.teamwork,
          motivation: data.motivation,
          overall: data.overall,
        },
        interviewerNotes: data.interviewerNotes,
        result: data.result,
        questionAnswers: data.questionAnswers,
        isCompleted: true,
      });

      setMessage('面试评分保存成功');
      setTimeout(() => {
        navigate('/admin/interviews');
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.error || '保存失败');
    } finally {
      setSaving(false);
    }
  };

  const getCategoryName = (category: string) => {
    const categoryNames = {
      technical: '技术问题',
      behavioral: '行为问题',
      motivation: '动机问题',
      general: '通用问题',
    };
    return categoryNames[category as keyof typeof categoryNames] || category;
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      technical: 'bg-blue-100 text-blue-800',
      behavioral: 'bg-green-100 text-green-800',
      motivation: 'bg-purple-100 text-purple-800',
      general: 'bg-gray-100 text-gray-800',
    };
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!interview || !application) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="neumorphic-card p-8 max-w-md text-center">
          <DocumentTextIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">面试信息不存在</h2>
          <button
            onClick={() => navigate('/admin/interviews')}
            className="neumorphic-button bg-primary-600 text-white"
          >
            返回面试管理
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航 */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/admin/interviews')}
                className="mr-4 p-2 rounded-lg hover:bg-gray-100"
              >
                <ArrowLeftIcon className="w-5 h-5" />
              </button>
              <h1 className="text-xl font-semibold">
                面试进行中 - {application.user?.name}
              </h1>
            </div>
            <div className="text-sm text-gray-500">
              {format(new Date(interview.scheduledAt), 'yyyy-MM-dd HH:mm', { locale: zhCN })}
            </div>
          </div>
        </div>
      </div>

      {message && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-start">
            <CheckCircleIcon className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
            <p className="text-green-800">{message}</p>
          </div>
        </div>
      )}

      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
            <XCircleIcon className="w-5 h-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
            <p className="text-red-800">{error}</p>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 左侧：申请单信息 */}
          <div className="space-y-6">
            {/* 基本信息 */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center">
                <DocumentTextIcon className="w-5 h-5 mr-2 text-primary-600" />
                申请人信息
              </h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">姓名：</span>
                  <span>{application.user?.name}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">邮箱：</span>
                  <span>{application.user?.email}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">学号：</span>
                  <span>{application.studentId}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">手机：</span>
                  <span>{application.phone}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">专业：</span>
                  <span>{application.major}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">年级：</span>
                  <span>{application.grade}</span>
                </div>
              </div>
            </div>

            {/* 申请内容 */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">申请内容</h3>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">自我介绍</h4>
                  <div className="bg-gray-50 p-3 rounded text-sm max-h-32 overflow-y-auto">
                    {application.introduction}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">技能特长</h4>
                  <div className="bg-gray-50 p-3 rounded text-sm max-h-24 overflow-y-auto">
                    {application.skills}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">项目经验</h4>
                  <div className="bg-gray-50 p-3 rounded text-sm max-h-24 overflow-y-auto">
                    {application.experience}
                  </div>
                </div>
              </div>
            </div>

            {/* 上传文件 */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">上传文件</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">个人照片</h4>
                  <FileViewer filePath={application.personalPhoto} label="个人照片" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">学生证</h4>
                  <FileViewer filePath={application.studentCardPhoto} label="学生证" />
                </div>
              </div>
            </div>
          </div>

          {/* 右侧：面试评分 */}
          <div className="space-y-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* 面试问题 */}
              {questions.length > 0 && (
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-lg font-semibold mb-4 flex items-center">
                    <QuestionMarkCircleIcon className="w-5 h-5 mr-2 text-primary-600" />
                    面试问题
                  </h2>
                  
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {questions.map((question, index) => (
                      <div key={question.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center mb-2">
                              <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium mr-2 ${getCategoryColor(question.category)}`}>
                                {getCategoryName(question.category)}
                              </span>
                              <span className="text-sm text-gray-500">问题 {index + 1}</span>
                            </div>
                            <p className="font-medium text-gray-900 mb-2">{question.question}</p>
                            {question.description && (
                              <p className="text-sm text-gray-600 mb-3">{question.description}</p>
                            )}
                          </div>
                        </div>
                        
                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              回答记录
                            </label>
                            <textarea
                              {...register(`questionAnswers.${index}.answer`)}
                              rows={3}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400 text-sm"
                              placeholder="记录面试者的回答..."
                            />
                          </div>
                          
                          <div className="flex items-center space-x-4">
                            <label className="block text-sm font-medium text-gray-700">
                              回答评分：
                            </label>
                            <input
                              {...register(`questionAnswers.${index}.score`, { valueAsNumber: true })}
                              type="number"
                              min="0"
                              max="10"
                              className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                              placeholder="0-10"
                            />
                            <span className="text-sm text-gray-500">分</span>
                          </div>
                        </div>

                        {/* 隐藏字段 */}
                        <input
                          {...register(`questionAnswers.${index}.questionId`)}
                          type="hidden"
                          value={question.id}
                        />
                        <input
                          {...register(`questionAnswers.${index}.question`)}
                          type="hidden"
                          value={question.question}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 综合评分 */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center">
                  <StarIcon className="w-5 h-5 mr-2 text-primary-600" />
                  综合评分
                </h2>
                
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      技术能力 (1-10分)
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
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      沟通表达 (1-10分)
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
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      团队协作 (1-10分)
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
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      学习动机 (1-10分)
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
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    综合评分 (1-10分)
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
                </div>

                <div className="mb-6">
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

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    面试结果
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        {...register('result')}
                        type="radio"
                        value="passed"
                        className="mr-2"
                      />
                      <CheckCircleIcon className="w-4 h-4 text-green-600 mr-1" />
                      通过
                    </label>
                    <label className="flex items-center">
                      <input
                        {...register('result')}
                        type="radio"
                        value="failed"
                        className="mr-2"
                      />
                      <XCircleIcon className="w-4 h-4 text-red-600 mr-1" />
                      未通过
                    </label>
                  </div>
                </div>

                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={() => navigate('/admin/interviews')}
                    className="neumorphic-button text-gray-600"
                    disabled={saving}
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    className="neumorphic-button bg-primary-600 text-white hover:bg-primary-700"
                    disabled={saving}
                  >
                    {saving ? '保存中...' : '完成面试'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterviewPanel;