import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import {
  QuestionMarkCircleIcon,
  BookOpenIcon,
  TagIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

interface InterviewQuestion {
  id: string;
  question: string;
  category: string;
  description?: string;
  isActive: boolean;
  sortOrder: number;
}

const QuestionBank: React.FC = () => {
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    loadQuestions();
  }, []);

  const loadQuestions = async () => {
    try {
      setLoading(true);
      const response = await api.get<InterviewQuestion[]>('/interviewer/questions');
      setQuestions(response.data);
    } catch (error) {
      console.error('Failed to load questions:', error);
    } finally {
      setLoading(false);
    }
  };

  const categories = ['all', ...Array.from(new Set(questions.map(q => q.category)))];
  
  const filteredQuestions = selectedCategory === 'all' 
    ? questions 
    : questions.filter(q => q.category === selectedCategory);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'technical':
        return '💻';
      case 'personal':
        return '👤';
      case 'project':
        return '🚀';
      case 'general':
        return '💬';
      default:
        return '❓';
    }
  };

  const getCategoryName = (category: string) => {
    const names: { [key: string]: string } = {
      'technical': '技术问题',
      'personal': '个人背景',
      'project': '项目经验',
      'general': '综合素质',
      'all': '全部分类',
    };
    return names[category] || category;
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
          <BookOpenIcon className="w-8 h-8 text-primary-600 mr-3" />
          <h1 className="text-3xl font-bold">面试题库</h1>
        </div>
      </div>

      {/* 分类筛选 */}
      <div className="neumorphic-card p-4 mb-6">
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                selectedCategory === category
                  ? 'bg-primary-100 text-primary-700 border border-primary-200'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <span className="mr-1">{getCategoryIcon(category)}</span>
              {getCategoryName(category)}
              <span className="ml-1 text-xs">
                ({category === 'all' ? questions.length : questions.filter(q => q.category === category).length})
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 题目列表 */}
      <div className="space-y-4">
        {filteredQuestions.length > 0 ? (
          filteredQuestions.map((question, index) => (
            <div key={question.id} className="neumorphic-card p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary-100 text-primary-600 text-sm font-medium">
                      {index + 1}
                    </span>
                    <div className="flex items-center space-x-2">
                      <TagIcon className="w-4 h-4 text-gray-400" />
                      <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800">
                        {getCategoryIcon(question.category)} {getCategoryName(question.category)}
                      </span>
                    </div>
                  </div>
                  
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {question.question}
                  </h3>
                  
                  {question.description && (
                    <p className="text-sm text-gray-600 mb-3">
                      💡 <strong>提示：</strong>{question.description}
                    </p>
                  )}
                  
                  <div className="flex items-center text-xs text-gray-500">
                    <ClockIcon className="w-3 h-3 mr-1" />
                    建议面试时使用此问题进行深入交流
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="neumorphic-card text-center py-12">
            <QuestionMarkCircleIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">
              {selectedCategory === 'all' ? '暂无面试题目' : `暂无${getCategoryName(selectedCategory)}相关题目`}
            </p>
          </div>
        )}
      </div>

      {/* 使用说明 */}
      <div className="mt-8 neumorphic-card p-6 bg-blue-50">
        <h3 className="text-lg font-medium text-blue-900 mb-3">💡 使用说明</h3>
        <div className="space-y-2 text-sm text-blue-800">
          <p>• 这些题目仅供面试参考，您可以根据申请者的具体情况灵活调整</p>
          <p>• 建议结合申请者的专业背景和申请材料选择合适的问题</p>
          <p>• 面试过程中可以基于这些题目进行深入的交流和讨论</p>
          <p>• 如需要新增题目，请联系管理员</p>
        </div>
      </div>
    </div>
  );
};

export default QuestionBank;