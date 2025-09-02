import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { 
  CheckCircleIcon, 
  XCircleIcon, 
  PencilIcon,
  PaperAirplaneIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  ChartBarIcon,
  DocumentTextIcon,
  UserGroupIcon,
  EnvelopeIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface InterviewResult {
  id: string;
  applicationId: string;
  applicant: {
    name: string;
    email: string;
    studentId: string;
    major: string;
    grade: string;
  };
  interviewDate: string;
  room: {
    name: string;
    location: string;
  };
  evaluationScores: {
    technical?: number;
    communication?: number;
    teamwork?: number;
    motivation?: number;
    overall?: number;
  };
  interviewerNotes?: string;
  questionAnswers?: any;
  result: 'passed' | 'failed' | 'pending';
  notificationSent: boolean;
  interviewers: Array<{
    id: string;
    name: string;
    title: string;
  }>;
  updatedAt: string;
}

interface EditingState {
  [key: string]: {
    evaluationScores: InterviewResult['evaluationScores'];
    interviewerNotes: string;
    result: string;
  };
}

const InterviewResults: React.FC = () => {
  const navigate = useNavigate();
  const [results, setResults] = useState<InterviewResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filter, setFilter] = useState({
    status: 'all',
    result: 'all',
  });
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingData, setEditingData] = useState<EditingState>({});
  const [sendingNotification, setSendingNotification] = useState(false);
  const [queueStatus, setQueueStatus] = useState<any>(null);
  const [userRole, setUserRole] = useState<string>('');

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      setUserRole(user.role);
    }
    loadResults();
  }, [page, filter]);

  const loadResults = async () => {
    try {
      setLoading(true);
      setError('');
      
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      });

      if (filter.status !== 'all') {
        params.append('status', filter.status);
      }
      if (filter.result !== 'all') {
        params.append('result', filter.result);
      }

      const response = await api.get(`/interview/results?${params}`);
      setResults(response.data.results);
      setTotalPages(response.data.totalPages);
    } catch (error: any) {
      setError(error.response?.data?.error || '加载面试结果失败');
    } finally {
      setLoading(false);
    }
  };

  const loadQueueStatus = async () => {
    try {
      const response = await api.get('/interview/email-queue/status');
      setQueueStatus(response.data.status);
    } catch (error) {
      console.error('Failed to load queue status:', error);
    }
  };

  const handleEdit = (result: InterviewResult) => {
    setEditingId(result.id);
    setEditingData({
      [result.id]: {
        evaluationScores: { ...result.evaluationScores },
        interviewerNotes: result.interviewerNotes || '',
        result: result.result,
      },
    });
  };

  const handleSave = async (id: string) => {
    try {
      const data = editingData[id];
      if (!data) return;

      await api.put(`/interview/results/${id}`, data);
      
      // 更新本地数据
      setResults(results.map(r => 
        r.id === id 
          ? { ...r, ...data }
          : r
      ));
      
      setEditingId(null);
      setEditingData({});
    } catch (error: any) {
      alert(error.response?.data?.error || '保存失败');
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditingData({});
  };

  const handleScoreChange = (id: string, field: string, value: number) => {
    setEditingData(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        evaluationScores: {
          ...prev[id]?.evaluationScores,
          [field]: value,
        },
      },
    }));
  };

  const handleSendSingle = async (id: string) => {
    if (!window.confirm('确定要发送结果通知吗？')) return;

    try {
      setSendingNotification(true);
      await api.post(`/interview/results/${id}/notify`);
      
      // 更新本地数据
      setResults(results.map(r => 
        r.id === id 
          ? { ...r, notificationSent: true }
          : r
      ));
      
      alert('通知已加入发送队列');
      loadQueueStatus();
    } catch (error: any) {
      alert(error.response?.data?.error || '发送失败');
    } finally {
      setSendingNotification(false);
    }
  };

  const handleBatchSend = async () => {
    if (selectedIds.length === 0) {
      alert('请选择要发送通知的面试记录');
      return;
    }

    if (!window.confirm(`确定要向 ${selectedIds.length} 个申请者发送结果通知吗？`)) {
      return;
    }

    try {
      setSendingNotification(true);
      const response = await api.post('/interview/results/batch-notify', {
        interviewIds: selectedIds,
      });
      
      alert(`成功加入 ${response.data.queued} 个通知到发送队列`);
      
      // 刷新列表
      loadResults();
      loadQueueStatus();
      setSelectedIds([]);
    } catch (error: any) {
      alert(error.response?.data?.error || '批量发送失败');
    } finally {
      setSendingNotification(false);
    }
  };

  const handleRetryFailed = async () => {
    try {
      const response = await api.post('/interview/email-queue/retry');
      alert(`重试 ${response.data.count} 个失败的邮件任务`);
      loadQueueStatus();
    } catch (error: any) {
      alert('重试失败');
    }
  };

  const getResultBadge = (result: string) => {
    switch (result) {
      case 'passed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircleIcon className="w-4 h-4 mr-1" />
            通过
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircleIcon className="w-4 h-4 mr-1" />
            未通过
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <ClockIcon className="w-4 h-4 mr-1" />
            待定
          </span>
        );
    }
  };

  const calculateAverageScore = (scores: InterviewResult['evaluationScores']) => {
    const values = Object.values(scores).filter(v => typeof v === 'number') as number[];
    if (values.length === 0) return 0;
    return (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1);
  };

  if (loading && results.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <ArrowPathIcon className="w-12 h-12 text-primary-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 页面标题 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">面试结果管理</h1>
          <p className="text-gray-600">查看和管理所有面试评分结果，发送结果通知</p>
        </div>

        {/* 统计卡片和队列状态 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="neumorphic-card p-4">
            <div className="flex items-center">
              <ChartBarIcon className="w-8 h-8 text-primary-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">总面试数</p>
                <p className="text-2xl font-bold text-gray-900">{results.length}</p>
              </div>
            </div>
          </div>
          
          <div className="neumorphic-card p-4">
            <div className="flex items-center">
              <CheckCircleIcon className="w-8 h-8 text-green-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">通过人数</p>
                <p className="text-2xl font-bold text-gray-900">
                  {results.filter(r => r.result === 'passed').length}
                </p>
              </div>
            </div>
          </div>

          <div className="neumorphic-card p-4">
            <div className="flex items-center">
              <EnvelopeIcon className="w-8 h-8 text-blue-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">已通知</p>
                <p className="text-2xl font-bold text-gray-900">
                  {results.filter(r => r.notificationSent).length}
                </p>
              </div>
            </div>
          </div>

          {queueStatus && (
            <div className="neumorphic-card p-4">
              <div className="flex items-center">
                <ClockIcon className="w-8 h-8 text-yellow-600 mr-3" />
                <div>
                  <p className="text-sm text-gray-600">队列中</p>
                  <p className="text-2xl font-bold text-gray-900">{queueStatus.pending}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 过滤器和操作按钮 */}
        <div className="neumorphic-card p-6 mb-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex gap-4">
              <select
                value={filter.status}
                onChange={(e) => setFilter({ ...filter, status: e.target.value })}
                className="neumorphic-input px-4 py-2"
              >
                <option value="all">全部状态</option>
                <option value="pending">未通知</option>
                <option value="notified">已通知</option>
              </select>

              <select
                value={filter.result}
                onChange={(e) => setFilter({ ...filter, result: e.target.value })}
                className="neumorphic-input px-4 py-2"
              >
                <option value="all">全部结果</option>
                <option value="passed">通过</option>
                <option value="failed">未通过</option>
                <option value="pending">待定</option>
              </select>
            </div>

            {userRole === 'admin' && (
              <div className="flex gap-2">
                <button
                  onClick={handleBatchSend}
                  disabled={selectedIds.length === 0 || sendingNotification}
                  className="neumorphic-button bg-primary-600 text-white px-4 py-2 disabled:opacity-50"
                >
                  <PaperAirplaneIcon className="w-5 h-5 mr-2 inline" />
                  批量发送通知 ({selectedIds.length})
                </button>

                {queueStatus?.failed > 0 && (
                  <button
                    onClick={handleRetryFailed}
                    className="neumorphic-button bg-yellow-600 text-white px-4 py-2"
                  >
                    <ArrowPathIcon className="w-5 h-5 mr-2 inline" />
                    重试失败 ({queueStatus.failed})
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 结果列表 */}
        <div className="space-y-4">
          {results.map((result) => {
            const isEditing = editingId === result.id;
            const editData = editingData[result.id];

            return (
              <div key={result.id} className="neumorphic-card p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-4">
                    {userRole === 'admin' && (
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(result.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedIds([...selectedIds, result.id]);
                          } else {
                            setSelectedIds(selectedIds.filter(id => id !== result.id));
                          }
                        }}
                        disabled={result.notificationSent}
                        className="mt-1"
                      />
                    )}
                    
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {result.applicant.name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {result.applicant.studentId} | {result.applicant.major} | {result.applicant.grade}
                      </p>
                      <p className="text-sm text-gray-500">{result.applicant.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {isEditing ? (
                      <select
                        value={editData?.result || result.result}
                        onChange={(e) => setEditingData(prev => ({
                          ...prev,
                          [result.id]: {
                            ...prev[result.id],
                            result: e.target.value,
                          },
                        }))}
                        className="neumorphic-input px-3 py-1"
                      >
                        <option value="pending">待定</option>
                        <option value="passed">通过</option>
                        <option value="failed">未通过</option>
                      </select>
                    ) : (
                      getResultBadge(result.result)
                    )}

                    {result.notificationSent && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        <EnvelopeIcon className="w-4 h-4 mr-1" />
                        已通知
                      </span>
                    )}
                  </div>
                </div>

                {/* 面试信息 */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 text-sm">
                  <div>
                    <span className="text-gray-600">面试时间：</span>
                    <span className="text-gray-900">
                      {format(new Date(result.interviewDate), 'yyyy年MM月dd日 HH:mm', { locale: zhCN })}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">面试地点：</span>
                    <span className="text-gray-900">{result.room.name} - {result.room.location}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">面试官：</span>
                    <span className="text-gray-900">
                      {result.interviewers.map(i => i.name).join(', ')}
                    </span>
                  </div>
                </div>

                {/* 评分 */}
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <h4 className="font-medium text-gray-900 mb-3">评分详情</h4>
                  <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                    {['technical', 'communication', 'teamwork', 'motivation', 'overall'].map((field) => (
                      <div key={field}>
                        <label className="block text-xs text-gray-600 mb-1">
                          {field === 'technical' && '技术能力'}
                          {field === 'communication' && '沟通能力'}
                          {field === 'teamwork' && '团队协作'}
                          {field === 'motivation' && '学习动力'}
                          {field === 'overall' && '综合评价'}
                        </label>
                        {isEditing ? (
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={editData?.evaluationScores?.[field as keyof typeof editData.evaluationScores] || 0}
                            onChange={(e) => handleScoreChange(result.id, field, Number(e.target.value))}
                            className="w-full neumorphic-input px-2 py-1 text-sm"
                          />
                        ) : (
                          <div className="text-lg font-semibold text-gray-900">
                            {result.evaluationScores[field as keyof typeof result.evaluationScores] || '-'}
                          </div>
                        )}
                      </div>
                    ))}
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">平均分</label>
                      <div className="text-lg font-bold text-primary-600">
                        {calculateAverageScore(isEditing ? editData?.evaluationScores || {} : result.evaluationScores)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 面试官备注 */}
                <div className="mb-4">
                  <h4 className="font-medium text-gray-900 mb-2">面试官备注</h4>
                  {isEditing ? (
                    <textarea
                      value={editData?.interviewerNotes || ''}
                      onChange={(e) => setEditingData(prev => ({
                        ...prev,
                        [result.id]: {
                          ...prev[result.id],
                          interviewerNotes: e.target.value,
                        },
                      }))}
                      rows={3}
                      className="w-full neumorphic-input p-3"
                      placeholder="请输入备注..."
                    />
                  ) : (
                    <p className="text-gray-700 whitespace-pre-wrap">
                      {result.interviewerNotes || '暂无备注'}
                    </p>
                  )}
                </div>

                {/* 操作按钮 */}
                <div className="flex justify-end gap-2">
                  {isEditing ? (
                    <>
                      <button
                        onClick={() => handleSave(result.id)}
                        className="neumorphic-button bg-green-600 text-white px-4 py-2"
                      >
                        保存
                      </button>
                      <button
                        onClick={handleCancel}
                        className="neumorphic-button bg-gray-600 text-white px-4 py-2"
                      >
                        取消
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => handleEdit(result)}
                        className="neumorphic-button bg-primary-600 text-white px-4 py-2"
                      >
                        <PencilIcon className="w-5 h-5 mr-2 inline" />
                        编辑
                      </button>
                      {userRole === 'admin' && !result.notificationSent && result.result !== 'pending' && (
                        <button
                          onClick={() => handleSendSingle(result.id)}
                          disabled={sendingNotification}
                          className="neumorphic-button bg-blue-600 text-white px-4 py-2 disabled:opacity-50"
                        >
                          <PaperAirplaneIcon className="w-5 h-5 mr-2 inline" />
                          发送通知
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* 分页 */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-8 gap-2">
            <button
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
              className="neumorphic-button px-4 py-2 disabled:opacity-50"
            >
              上一页
            </button>
            <span className="flex items-center px-4">
              第 {page} / {totalPages} 页
            </span>
            <button
              onClick={() => setPage(page + 1)}
              disabled={page === totalPages}
              className="neumorphic-button px-4 py-2 disabled:opacity-50"
            >
              下一页
            </button>
          </div>
        )}

        {error && (
          <div className="fixed bottom-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            <ExclamationTriangleIcon className="w-5 h-5 inline mr-2" />
            {error}
          </div>
        )}
      </div>
    </div>
  );
};

export default InterviewResults;