import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import api from '../../services/api';
import { Interview, Application } from '../../types';
import {
  XMarkIcon,
  CheckCircleIcon,
  XCircleIcon,
  EnvelopeIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  UserIcon,
  AcademicCapIcon,
} from '@heroicons/react/24/outline';

interface ResultConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

interface InterviewWithDetails extends Interview {
  application: Application & {
    user: {
      id: string;
      name: string;
      email: string;
    };
  };
}

const ResultConfirmationModal: React.FC<ResultConfirmationModalProps> = ({
  isOpen,
  onClose,
  onComplete,
}) => {
  const [step, setStep] = useState<'accepted' | 'rejected' | 'confirm'>('accepted');
  const [acceptedList, setAcceptedList] = useState<InterviewWithDetails[]>([]);
  const [rejectedList, setRejectedList] = useState<InterviewWithDetails[]>([]);
  const [loading, setLoading] = useState(false);
  const [acceptedConfirmed, setAcceptedConfirmed] = useState(false);
  const [rejectedConfirmed, setRejectedConfirmed] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [selectedInterview, setSelectedInterview] = useState<InterviewWithDetails | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadCompletedInterviews();
    }
  }, [isOpen]);

  const loadCompletedInterviews = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/interviews', {
        params: { completed: true, limit: 100 }
      });
      
      const interviews = response.data.interviews || [];
      const accepted = interviews.filter((i: InterviewWithDetails) => i.result === 'passed');
      const rejected = interviews.filter((i: InterviewWithDetails) => i.result === 'failed');
      
      setAcceptedList(accepted);
      setRejectedList(rejected);
    } catch (error) {
      console.error('Failed to load interviews:', error);
      setError('加载面试结果失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSendNotifications = async () => {
    try {
      setLoading(true);
      setError('');
      setMessage('');

      // 发送录取通知
      for (const interview of acceptedList) {
        await api.post(`/admin/interviews/${interview.id}/result`, {
          accepted: true,
          feedback: interview.interviewerNotes || '恭喜您通过面试！',
        });
      }

      // 发送淘汰通知
      for (const interview of rejectedList) {
        await api.post(`/admin/interviews/${interview.id}/result`, {
          accepted: false,
          feedback: interview.interviewerNotes || '感谢您的参与，请继续努力！',
        });
      }

      setMessage(`成功发送 ${acceptedList.length + rejectedList.length} 封邮件通知`);
      onComplete();
      
      setTimeout(() => {
        onClose();
        resetState();
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.error || '发送邮件失败');
    } finally {
      setLoading(false);
    }
  };

  const resetState = () => {
    setStep('accepted');
    setAcceptedConfirmed(false);
    setRejectedConfirmed(false);
    setSelectedInterview(null);
    setMessage('');
    setError('');
  };

  const renderInterviewList = (interviews: InterviewWithDetails[], type: 'accepted' | 'rejected') => {
    const bgColor = type === 'accepted' ? 'bg-green-50' : 'bg-red-50';
    const borderColor = type === 'accepted' ? 'border-green-200' : 'border-red-200';
    
    return (
      <div className={`${bgColor} ${borderColor} border rounded-lg p-4 max-h-80 overflow-y-auto`}>
        {interviews.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            暂无{type === 'accepted' ? '录取' : '淘汰'}人员
          </p>
        ) : (
          <div className="space-y-2">
            {interviews.map((interview) => (
              <div
                key={interview.id}
                className="flex items-center justify-between bg-white p-3 rounded border"
              >
                <div className="flex-1">
                  <div className="flex items-center">
                    <UserIcon className="w-4 h-4 text-gray-400 mr-2" />
                    <span className="font-medium">{interview.application.user.name}</span>
                  </div>
                  <div className="flex items-center mt-1 text-sm text-gray-500">
                    <AcademicCapIcon className="w-3 h-3 mr-1" />
                    <span>{interview.application.major} - {interview.application.grade}</span>
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    面试时间: {format(new Date(interview.scheduledAt), 'MM-dd HH:mm', { locale: zhCN })}
                  </div>
                </div>
                
                <button
                  onClick={() => setSelectedInterview(interview)}
                  className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs hover:bg-gray-200 transition-colors"
                >
                  <EyeIcon className="w-3 h-3 mr-1" />
                  查看详情
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold flex items-center">
            <EnvelopeIcon className="w-6 h-6 mr-2 text-primary-600" />
            面试结果确认与通知
          </h2>
          <button
            onClick={() => {
              onClose();
              resetState();
            }}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
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

          {/* 录取名单确认 */}
          {step === 'accepted' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <CheckCircleIcon className="w-5 h-5 mr-2 text-green-600" />
                  录取名单确认 ({acceptedList.length}人)
                </h3>
                {renderInterviewList(acceptedList, 'accepted')}
              </div>

              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="acceptedConfirm"
                  checked={acceptedConfirmed}
                  onChange={(e) => setAcceptedConfirmed(e.target.checked)}
                  className="w-4 h-4"
                />
                <label htmlFor="acceptedConfirm" className="text-sm font-medium">
                  我已确认无误，同意录取以上人员
                </label>
              </div>

              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => {
                    onClose();
                    resetState();
                  }}
                  className="neumorphic-button text-gray-600"
                >
                  取消
                </button>
                <button
                  onClick={() => setStep('rejected')}
                  disabled={!acceptedConfirmed}
                  className="neumorphic-button bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  下一步：确认淘汰名单
                </button>
              </div>
            </div>
          )}

          {/* 淘汰名单确认 */}
          {step === 'rejected' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <XCircleIcon className="w-5 h-5 mr-2 text-red-600" />
                  淘汰名单确认 ({rejectedList.length}人)
                </h3>
                {renderInterviewList(rejectedList, 'rejected')}
              </div>

              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="rejectedConfirm"
                  checked={rejectedConfirmed}
                  onChange={(e) => setRejectedConfirmed(e.target.checked)}
                  className="w-4 h-4"
                />
                <label htmlFor="rejectedConfirm" className="text-sm font-medium">
                  已确认淘汰以上人员
                </label>
              </div>

              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => setStep('accepted')}
                  className="neumorphic-button text-gray-600"
                >
                  返回上一步
                </button>
                <button
                  onClick={() => setStep('confirm')}
                  disabled={!rejectedConfirmed}
                  className="neumorphic-button bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  最终确认
                </button>
              </div>
            </div>
          )}

          {/* 最终确认 */}
          {step === 'confirm' && (
            <div className="space-y-6">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-4 text-yellow-800">
                  最终确认
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-green-700">录取人员：</span>
                    <span className="text-green-600">{acceptedList.length}人</span>
                  </div>
                  <div>
                    <span className="font-medium text-red-700">淘汰人员：</span>
                    <span className="text-red-600">{rejectedList.length}人</span>
                  </div>
                </div>
                <p className="text-yellow-700 mt-3">
                  确认后将向所有人员发送邮件通知，此操作不可撤销！
                </p>
              </div>

              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => setStep('rejected')}
                  className="neumorphic-button text-gray-600"
                  disabled={loading}
                >
                  返回修改
                </button>
                <button
                  onClick={handleSendNotifications}
                  disabled={loading}
                  className="neumorphic-button bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                >
                  {loading ? '发送中...' : '确认发送邮件'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 详情查看模态框 */}
        {selectedInterview && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-60">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="text-lg font-semibold">面试详情</h3>
                <button
                  onClick={() => setSelectedInterview(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-4 space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">申请人：</span>
                    <span>{selectedInterview.application.user.name}</span>
                  </div>
                  <div>
                    <span className="font-medium">专业：</span>
                    <span>{selectedInterview.application.major}</span>
                  </div>
                  <div>
                    <span className="font-medium">年级：</span>
                    <span>{selectedInterview.application.grade}</span>
                  </div>
                  <div>
                    <span className="font-medium">面试结果：</span>
                    <span className={selectedInterview.result === 'passed' ? 'text-green-600' : 'text-red-600'}>
                      {selectedInterview.result === 'passed' ? '通过' : '未通过'}
                    </span>
                  </div>
                </div>
                
                {selectedInterview.evaluationScores && (
                  <div>
                    <h4 className="font-medium mb-2">评分详情</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>技术能力: {selectedInterview.evaluationScores.technical}/10</div>
                      <div>沟通表达: {selectedInterview.evaluationScores.communication}/10</div>
                      <div>团队协作: {selectedInterview.evaluationScores.teamwork}/10</div>
                      <div>学习动机: {selectedInterview.evaluationScores.motivation}/10</div>
                      <div className="col-span-2 font-medium">
                        综合评分: {selectedInterview.evaluationScores.overall}/10
                      </div>
                    </div>
                  </div>
                )}
                
                {selectedInterview.interviewerNotes && (
                  <div>
                    <h4 className="font-medium mb-2">面试备注</h4>
                    <div className="bg-gray-50 p-3 rounded text-sm">
                      {selectedInterview.interviewerNotes}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex justify-end p-4 border-t">
                <button
                  onClick={() => setSelectedInterview(null)}
                  className="neumorphic-button text-gray-600"
                >
                  关闭
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResultConfirmationModal;