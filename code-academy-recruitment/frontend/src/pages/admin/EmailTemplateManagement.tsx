import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import api from '../../services/api';
import {
  EnvelopeIcon,
  PencilIcon,
  EyeIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

interface EmailTemplate {
  id: string;
  type: string;
  name: string;
  subject: string;
  htmlContent: string;
  variables?: string;
  isActive: boolean;
}

interface TemplateFormData {
  name: string;
  subject: string;
  htmlContent: string;
  isActive: boolean;
}

const EmailTemplateManagement: React.FC = () => {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewHtml, setPreviewHtml] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<TemplateFormData>();

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const response = await api.get<EmailTemplate[]>('/admin/email-templates');
      setTemplates(response.data);
    } catch (error) {
      console.error('Failed to load templates:', error);
      setError('加载邮件模板失败');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (template: EmailTemplate) => {
    setEditingTemplate(template);
    setValue('name', template.name);
    setValue('subject', template.subject);
    setValue('htmlContent', template.htmlContent);
    setValue('isActive', template.isActive);
    setShowEditor(true);
  };

  const onSubmit = async (data: TemplateFormData) => {
    if (!editingTemplate) return;

    try {
      setError('');
      setMessage('');

      await api.put(`/admin/email-templates/${editingTemplate.type}`, data);
      
      setMessage('邮件模板更新成功');
      setShowEditor(false);
      setEditingTemplate(null);
      reset();
      loadTemplates();
    } catch (err: any) {
      setError(err.response?.data?.error || '更新失败');
    }
  };

  const handlePreview = async () => {
    if (!editingTemplate) return;

    try {
      const variables = getPreviewVariables(editingTemplate.type);
      const response = await api.post(`/admin/email-templates/${editingTemplate.type}/preview`, {
        variables,
      });
      
      setPreviewHtml(response.data.html);
      setShowPreview(true);
    } catch (err: any) {
      setError(err.response?.data?.error || '预览失败');
    }
  };

  const getPreviewVariables = (type: string): Record<string, any> => {
    const commonVars = {
      verification_code: { code: '123456' },
      interview_notification: {
        name: '张三',
        interviewDate: '2024-01-15 09:00',
        room: '会议室A',
        location: '教学楼3楼301室',
      },
      interview_result_accepted: {
        name: '张三',
        feedback: '表现优秀，技术能力强，沟通能力佳。',
      },
      interview_result_rejected: {
        name: '李四',
        feedback: '基础知识还需加强，建议多练习编程。',
      },
      password_reset: {
        name: '王五',
        newPassword: 'abc123def',
      },
    };

    return commonVars[type as keyof typeof commonVars] || {};
  };

  const getTemplateTypeName = (type: string) => {
    const typeNames = {
      verification_code: '邮箱验证码',
      interview_notification: '面试通知',
      interview_result_accepted: '面试通过通知',
      interview_result_rejected: '面试未通过通知',
      password_reset: '密码重置通知',
    };
    return typeNames[type as keyof typeof typeNames] || type;
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
          <EnvelopeIcon className="w-8 h-8 text-primary-600 mr-3" />
          <h1 className="text-3xl font-bold">邮件模板管理</h1>
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

      {/* 模板列表 */}
      <div className="neumorphic-card">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  模板名称
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  类型
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
              {templates.map((template) => (
                <tr key={template.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{template.name}</div>
                    <div className="text-sm text-gray-500 truncate max-w-xs">{template.subject}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {getTemplateTypeName(template.type)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {template.isActive ? (
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
                        onClick={() => handleEdit(template)}
                        className="inline-flex items-center justify-center px-2 py-1 bg-primary-100 text-primary-700 rounded text-xs hover:bg-primary-200 transition-colors"
                      >
                        <PencilIcon className="w-3 h-3 sm:mr-1" />
                        <span className="hidden sm:inline">编辑</span>
                      </button>
                      <button
                        onClick={() => {
                          setEditingTemplate(template);
                          handlePreview();
                        }}
                        className="inline-flex items-center justify-center px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200 transition-colors"
                      >
                        <EyeIcon className="w-3 h-3 sm:mr-1" />
                        <span className="hidden sm:inline">预览</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 编辑模态框 */}
      {showEditor && editingTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold">编辑邮件模板</h2>
              <button
                onClick={() => {
                  setShowEditor(false);
                  setEditingTemplate(null);
                  reset();
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  模板名称 <span className="text-red-500">*</span>
                </label>
                <input
                  {...register('name', { required: '请输入模板名称' })}
                  className="neumorphic-input"
                  placeholder="模板名称"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  邮件主题 <span className="text-red-500">*</span>
                </label>
                <input
                  {...register('subject', { required: '请输入邮件主题' })}
                  className="neumorphic-input"
                  placeholder="邮件主题"
                />
                {errors.subject && (
                  <p className="mt-1 text-sm text-red-600">{errors.subject.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  邮件内容 (HTML) <span className="text-red-500">*</span>
                </label>
                <textarea
                  {...register('htmlContent', { required: '请输入邮件内容' })}
                  rows={15}
                  className="neumorphic-input font-mono text-sm"
                  placeholder="HTML内容..."
                />
                {errors.htmlContent && (
                  <p className="mt-1 text-sm text-red-600">{errors.htmlContent.message}</p>
                )}
                
                {editingTemplate.variables && (
                  <div className="mt-2 p-3 bg-blue-50 rounded text-sm">
                    <p className="font-medium text-blue-800 mb-1">可用变量：</p>
                    <p className="text-blue-700">
                      {JSON.parse(editingTemplate.variables).map((v: string) => `{{${v}}}`).join(', ')}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex items-center">
                <input
                  {...register('isActive')}
                  type="checkbox"
                  className="mr-2"
                />
                <label className="text-sm font-medium text-gray-700">启用此模板</label>
              </div>

              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={handlePreview}
                  className="neumorphic-button bg-blue-600 text-white hover:bg-blue-700"
                >
                  预览效果
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowEditor(false);
                    setEditingTemplate(null);
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
                  保存
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 预览模态框 */}
      {showPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold">邮件预览</h2>
              <button
                onClick={() => setShowPreview(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            
            <div className="p-6">
              <div className="border rounded-lg p-4 bg-gray-50 max-h-96 overflow-y-auto">
                <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
              </div>
            </div>
            
            <div className="flex justify-end p-6 border-t">
              <button
                onClick={() => setShowPreview(false)}
                className="neumorphic-button text-gray-600"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmailTemplateManagement;