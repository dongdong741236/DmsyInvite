import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import api from '../../services/api';
import { Application } from '../../types';
import ApplicationDetailModal from '../../components/admin/ApplicationDetailModal';
import {
  DocumentTextIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  CalendarIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

interface ApplicationsResponse {
  applications: Application[];
  total: number;
  page: number;
  totalPages: number;
}

const ApplicationManagement: React.FC = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    loadApplications();
  }, [page, search, statusFilter]);

  const loadApplications = async () => {
    try {
      setLoading(true);
      const response = await api.get<ApplicationsResponse>('/admin/applications', {
        params: { page, limit: 20, search, status: statusFilter },
      });
      
      setApplications(response.data.applications);
      setTotal(response.data.total);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      console.error('Failed to load applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadApplications();
  };

  const handleViewApplication = async (applicationId: string) => {
    try {
      const response = await api.get<Application>(`/admin/applications/${applicationId}`);
      setSelectedApplication(response.data);
      setShowDetailModal(true);
    } catch (err: any) {
      setError(err.response?.data?.error || '获取申请详情失败');
    }
  };

  const updateApplicationStatus = async (id: string, status: string, reviewNotes?: string) => {
    try {
      console.log('=== 更新申请状态 ===');
      console.log('申请ID:', id);
      console.log('新状态:', status);
      console.log('审核备注:', reviewNotes);
      
      setError('');
      setMessage('');
      
      const response = await api.put(`/admin/applications/${id}/status`, {
        status,
        reviewNotes,
      });
      
      console.log('状态更新响应:', response.data);
      setMessage('申请状态更新成功');
      // 重新加载数据
      loadApplications();
    } catch (err: any) {
      console.error('状态更新失败:', err);
      console.error('错误详情:', err.response?.data);
      setError(err.response?.data?.error || '更新申请状态失败');
    }
  };

  const getStatusBadge = (status: Application['status']) => {
    const statusConfig: Record<Application['status'], { color: string; icon: any; text: string }> = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: ClockIcon, text: '待审核' },
      reviewing: { color: 'bg-blue-100 text-blue-800', icon: ClockIcon, text: '审核中' },
      approved: { color: 'bg-green-100 text-green-800', icon: CheckCircleIcon, text: '审核通过' },
      interview_scheduled: { color: 'bg-purple-100 text-purple-800', icon: CalendarIcon, text: '已安排面试' },
      interviewed: { color: 'bg-indigo-100 text-indigo-800', icon: CheckCircleIcon, text: '已面试' },
      accepted: { color: 'bg-green-100 text-green-800', icon: CheckCircleIcon, text: '已录取' },
      rejected: { color: 'bg-red-100 text-red-800', icon: XCircleIcon, text: '未通过' },
    };

    const config = statusConfig[status];
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {config.text}
      </span>
    );
  };

  if (loading && applications.length === 0) {
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
          <DocumentTextIcon className="w-8 h-8 text-primary-600 mr-3" />
          <h1 className="text-3xl font-bold">申请管理</h1>
        </div>
        <div className="text-sm text-gray-500">
          共 {total} 个申请
        </div>
      </div>

      {/* 搜索和筛选 */}
      <div className="neumorphic-card mb-6">
        <form onSubmit={handleSearch} className="flex gap-4">
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="搜索姓名、邮箱或学号..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400"
              />
            </div>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400"
          >
            <option value="">所有状态</option>
            <option value="pending">待审核</option>
            <option value="reviewing">审核中</option>
            <option value="interview_scheduled">已安排面试</option>
            <option value="interviewed">已面试</option>
            <option value="accepted">已录取</option>
            <option value="rejected">未通过</option>
          </select>
          <button
            type="submit"
            className="neumorphic-button bg-primary-600 text-white hover:bg-primary-700"
          >
            搜索
          </button>
        </form>
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

      {/* 申请列表 */}
      <div className="neumorphic-card">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  申请人信息
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  专业年级
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  申请状态
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  申请时间
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {applications.map((application) => (
                <tr key={application.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {application.user?.name || '未知'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {application.user?.email || '未知'}
                      </div>
                      <div className="text-sm text-gray-500">
                        学号：{application.studentId}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{application.major}</div>
                    <div className="text-sm text-gray-500">{application.grade}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(application.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {format(new Date(application.createdAt), 'MM-dd HH:mm', { locale: zhCN })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex flex-wrap gap-1">
                      <button 
                        onClick={() => handleViewApplication(application.id)}
                        className="inline-flex items-center px-2 py-1 bg-primary-100 text-primary-700 rounded text-xs hover:bg-primary-200 transition-colors"
                      >
                        <EyeIcon className="w-3 h-3 mr-1" />
                        查看详情
                      </button>
                      
                      {application.status === 'pending' && (
                        <button
                          onClick={() => updateApplicationStatus(application.id, 'reviewing')}
                          className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200 transition-colors"
                        >
                          开始审核
                        </button>
                      )}
                      
                      {application.status === 'reviewing' && (
                        <>
                          <button
                            onClick={() => updateApplicationStatus(application.id, 'approved')}
                            className="inline-flex items-center px-2 py-1 bg-green-100 text-green-700 rounded text-xs hover:bg-green-200 transition-colors"
                          >
                            审核通过
                          </button>
                          <button
                            onClick={() => updateApplicationStatus(application.id, 'rejected')}
                            className="inline-flex items-center px-2 py-1 bg-red-100 text-red-700 rounded text-xs hover:bg-red-200 transition-colors"
                          >
                            审核拒绝
                          </button>
                        </>
                      )}
                      
                      {(application.status === 'pending' || application.status === 'reviewing') && (
                        <button
                          onClick={() => updateApplicationStatus(application.id, 'accepted')}
                          className="inline-flex items-center px-2 py-1 bg-green-100 text-green-700 rounded text-xs hover:bg-green-200 transition-colors"
                        >
                          直接录取
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 分页 */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-3 bg-gray-50">
            <div className="text-sm text-gray-700">
              第 {page} 页，共 {totalPages} 页，总计 {total} 个申请
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page <= 1}
                className="neumorphic-button disabled:opacity-50 disabled:cursor-not-allowed"
              >
                上一页
              </button>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page >= totalPages}
                className="neumorphic-button disabled:opacity-50 disabled:cursor-not-allowed"
              >
                下一页
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 申请详情模态框 */}
      <ApplicationDetailModal
        application={selectedApplication}
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedApplication(null);
        }}
      />
    </div>
  );
};

export default ApplicationManagement;