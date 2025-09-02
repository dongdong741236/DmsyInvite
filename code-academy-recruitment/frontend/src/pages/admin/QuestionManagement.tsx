import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import api from '../../services/api';
import {
  QuestionMarkCircleIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

interface InterviewQuestion {
  id: string;
  question: string;
  category: 'technical' | 'behavioral' | 'motivation' | 'general';
  description?: string;
  isActive: boolean;
  sortOrder: number;
}

interface QuestionFormData {
  question: string;
  category: 'technical' | 'behavioral' | 'motivation' | 'general';
  description?: string;
  isActive: boolean;
  sortOrder: number;
}

const QuestionManagement: React.FC = () => {
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<InterviewQuestion | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<QuestionFormData>({
    defaultValues: {
      isActive: true,
      sortOrder: 0,
    },
  });

  useEffect(() => {
    loadQuestions();
  }, []);

  const loadQuestions = async () => {
    try {
      setLoading(true);
      const response = await api.get<InterviewQuestion[]>('/admin/interview-questions/all');
      setQuestions(response.data);
    } catch (error) {
      console.error('Failed to load questions:', error);
      setError('加载面试问题失败');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: QuestionFormData) => {
    try {
      setError('');
      setMessage('');

      if (editingQuestion) {
        await api.put(`/admin/interview-questions/${editingQuestion.id}`, data);
        setMessage('问题更新成功');
      } else {
        await api.post('/admin/interview-questions', data);
        setMessage('问题创建成功');
      }

      setShowForm(false);
      setEditingQuestion(null);
      reset();
      loadQuestions();
    } catch (err: any) {
      setError(err.response?.data?.error || '操作失败');
    }
  };

  const handleEdit = (question: InterviewQuestion) => {
    setEditingQuestion(question);
    setValue('question', question.question);
    setValue('category', question.category);
    setValue('description', question.description || '');
    setValue('isActive', question.isActive);
    setValue('sortOrder', question.sortOrder);
    setShowForm(true);
  };

  const handleDelete = async (id: string, questionText: string) => {
    if (!window.confirm(`确定要删除问题"${questionText}"吗？`)) {
      return;
    }

    try {
      await api.delete(`/admin/interview-questions/${id}`);
      setMessage('问题删除成功');
      loadQuestions();
    } catch (err: any) {
      setError(err.response?.data?.error || '删除失败');
    }
  };

  const handleAddNew = () => {
    setEditingQuestion(null);
    reset({
      isActive: true,
      sortOrder: questions.length + 1,
    });
    setShowForm(true);
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

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center">
          <QuestionMarkCircleIcon className="w-8 h-8 text-primary-600 mr-3" />
          <h1 className="text-3xl font-bold">面试问题管理</h1>
        </div>
        <button
          onClick={handleAddNew}
          className="neumorphic-button bg-primary-600 text-white hover:bg-primary-700 flex items-center"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          添加问题
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

      {/* 问题表单 */}
      {showForm && (
        <div className="neumorphic-card mb-6">
          <h2 className="text-xl font-semibold mb-4">
            {editingQuestion ? '编辑问题' : '添加问题'}
          </h2>
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  问题内容 <span className="text-red-500">*</span>
                </label>
                <textarea
                  {...register('question', { required: '请输入问题内容' })}
                  rows={3}
                  className="neumorphic-input"
                  placeholder="请输入面试问题..."
                />
                {errors.question && (
                  <p className="mt-1 text-sm text-red-600">{errors.question.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  问题类别 <span className="text-red-500">*</span>
                </label>
                <select
                  {...register('category', { required: '请选择问题类别' })}
                  className="neumorphic-input"
                >
                  <option value="">请选择类别</option>
                  <option value="technical">技术问题</option>
                  <option value="behavioral">行为问题</option>
                  <option value="motivation">动机问题</option>
                  <option value="general">通用问题</option>
                </select>
                {errors.category && (
                  <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  排序顺序
                </label>
                <input
                  {...register('sortOrder', { valueAsNumber: true })}
                  type="number"
                  min="0"
                  className="neumorphic-input"
                  placeholder="0"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  问题说明
                </label>
                <textarea
                  {...register('description')}
                  rows={2}
                  className="neumorphic-input"
                  placeholder="问题的评分标准或说明（可选）"
                />
              </div>

              <div className="md:col-span-2">
                <div className="flex items-center">
                  <input
                    {...register('isActive')}
                    type="checkbox"
                    className="mr-2"
                  />
                  <label className="text-sm font-medium text-gray-700">启用此问题</label>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingQuestion(null);
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
                {editingQuestion ? '更新' : '创建'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 问题列表 */}
      <div className="neumorphic-card">
        <div className="space-y-4">
          {questions.map((question, index) => (
            <div
              key={question.id}
              className={`border rounded-lg p-4 ${question.isActive ? 'bg-white' : 'bg-gray-50'}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium mr-2 ${getCategoryColor(question.category)}`}>
                      {getCategoryName(question.category)}
                    </span>
                    <span className="text-sm text-gray-500">#{question.sortOrder}</span>
                    {!question.isActive && (
                      <span className="ml-2 inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800">
                        已禁用
                      </span>
                    )}
                  </div>
                  
                  <h3 className="font-medium text-gray-900 mb-2">{question.question}</h3>
                  
                  {question.description && (
                    <p className="text-sm text-gray-600">{question.description}</p>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-1 ml-4">
                  <button
                    onClick={() => handleEdit(question)}
                    className="inline-flex items-center justify-center px-2 py-1 bg-primary-100 text-primary-700 rounded text-xs hover:bg-primary-200 transition-colors"
                  >
                    <PencilIcon className="w-3 h-3 sm:mr-1" />
                    <span className="hidden sm:inline">编辑</span>
                  </button>
                  
                  <button
                    onClick={() => handleDelete(question.id, question.question)}
                    className="inline-flex items-center justify-center px-2 py-1 bg-red-100 text-red-700 rounded text-xs hover:bg-red-200 transition-colors"
                  >
                    <TrashIcon className="w-3 h-3 sm:mr-1" />
                    <span className="hidden sm:inline">删除</span>
                  </button>
                </div>
              </div>
            </div>
          ))}

          {questions.length === 0 && (
            <div className="text-center py-12">
              <QuestionMarkCircleIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">暂无面试问题</p>
              <button
                onClick={handleAddNew}
                className="mt-4 neumorphic-button bg-primary-600 text-white hover:bg-primary-700"
              >
                添加第一个问题
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuestionManagement;