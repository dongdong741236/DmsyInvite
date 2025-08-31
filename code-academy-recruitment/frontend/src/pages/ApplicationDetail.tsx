import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import api from '../services/api';
import { Application } from '../types';
import {
  DocumentTextIcon,
  ArrowLeftIcon,
  CalendarIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  UserIcon,
  PhoneIcon,
  AcademicCapIcon,
  PhotoIcon,
  DocumentArrowDownIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';

const ApplicationDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (id) {
      loadApplication(id);
    }
  }, [id]);

  const loadApplication = async (applicationId: string) => {
    try {
      setLoading(true);
      const response = await api.get<Application>(`/applications/${applicationId}`);
      setApplication(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || '获取申请详情失败');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: Application['status']) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: ClockIcon, text: '待审核' },
      reviewing: { color: 'bg-blue-100 text-blue-800', icon: ClockIcon, text: '审核中' },
      interview_scheduled: { color: 'bg-purple-100 text-purple-800', icon: CalendarIcon, text: '已安排面试' },
      interviewed: { color: 'bg-indigo-100 text-indigo-800', icon: CheckCircleIcon, text: '已面试' },
      accepted: { color: 'bg-green-100 text-green-800', icon: CheckCircleIcon, text: '已录取' },
      rejected: { color: 'bg-red-100 text-red-800', icon: XCircleIcon, text: '未通过' },
    };

    const config = statusConfig[status];
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
        <Icon className="w-4 h-4 mr-2" />
        {config.text}
      </span>
    );
  };

  const renderFileLink = (filePath: string | undefined, label: string) => {
    if (!filePath) return <span className="text-gray-400">未上传</span>;
    
    return (
      <a
        href={`/uploads/${filePath}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary-600 hover:text-primary-900 flex items-center"
      >
        <DocumentArrowDownIcon className="w-4 h-4 mr-1" />
        查看{label}
      </a>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="neumorphic-card p-8 max-w-md text-center">
          <ExclamationCircleIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">加载失败</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => navigate('/applications')}
            className="neumorphic-button bg-primary-600 text-white"
          >
            返回申请列表
          </button>
        </div>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="neumorphic-card p-8 max-w-md text-center">
          <DocumentTextIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">申请不存在</h2>
          <p className="text-gray-600 mb-4">未找到指定的申请记录</p>
          <button
            onClick={() => navigate('/applications')}
            className="neumorphic-button bg-primary-600 text-white"
          >
            返回申请列表
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* 页面头部 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <button
            onClick={() => navigate('/applications')}
            className="neumorphic-button mr-4"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold flex items-center">
              <DocumentTextIcon className="w-8 h-8 text-primary-600 mr-3" />
              申请详情
            </h1>
            <p className="text-gray-600 mt-1">
              申请时间：{format(new Date(application.createdAt), 'yyyy-MM-dd HH:mm:ss', { locale: zhCN })}
            </p>
          </div>
        </div>
        <div>
          {getStatusBadge(application.status)}
        </div>
      </div>

      {/* 基本信息 */}
      <div className="neumorphic-card">
        <h2 className="text-xl font-semibold mb-6 flex items-center">
          <UserIcon className="w-6 h-6 mr-2 text-primary-600" />
          基本信息
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">学号</label>
            <p className="text-gray-900">{application.studentId}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">手机号</label>
            <div className="flex items-center">
              <PhoneIcon className="w-4 h-4 text-gray-400 mr-2" />
              <span>{application.phone}</span>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">专业年级</label>
            <div className="flex items-center">
              <AcademicCapIcon className="w-4 h-4 text-gray-400 mr-2" />
              <span>{application.major} - {application.grade}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 上传文件 */}
      <div className="neumorphic-card">
        <h2 className="text-xl font-semibold mb-6 flex items-center">
          <PhotoIcon className="w-6 h-6 mr-2 text-primary-600" />
          上传文件
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">个人照片</label>
            {renderFileLink(application.personalPhoto, '个人照片')}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">学生证照片</label>
            {renderFileLink(application.studentCardPhoto, '学生证')}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">佐证材料</label>
            {application.experienceAttachments && application.experienceAttachments.length > 0 ? (
              <div className="space-y-1">
                {application.experienceAttachments.map((filePath, index) => (
                  <a
                    key={index}
                    href={`/uploads/${filePath}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-600 hover:text-primary-900 flex items-center text-sm"
                  >
                    <DocumentArrowDownIcon className="w-4 h-4 mr-1" />
                    佐证材料 {index + 1}
                  </a>
                ))}
              </div>
            ) : (
              <span className="text-gray-400">未上传</span>
            )}
          </div>
        </div>
      </div>

      {/* 申请内容 */}
      <div className="neumorphic-card">
        <h2 className="text-xl font-semibold mb-6">申请内容</h2>
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">自我介绍</label>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-900 whitespace-pre-wrap">{application.introduction}</p>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">技能特长</label>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-900 whitespace-pre-wrap">{application.skills}</p>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">项目经验</label>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-900 whitespace-pre-wrap">{application.experience}</p>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">加入动机</label>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-900 whitespace-pre-wrap">{application.motivation}</p>
            </div>
          </div>
          
          {application.portfolio && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">作品集链接</label>
              <a
                href={application.portfolio}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-600 hover:text-primary-900"
              >
                {application.portfolio}
              </a>
            </div>
          )}
        </div>
      </div>

      {/* 年级特定信息 */}
      {application.gradeSpecificInfo && (
        <div className="neumorphic-card">
          <h2 className="text-xl font-semibold mb-6">年级特定信息</h2>
          
          {application.grade === '大一' && application.gradeSpecificInfo.highSchoolInfo && (
            <div className="space-y-4">
              <h3 className="font-medium text-lg">高中背景</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">高中学校</label>
                  <p className="text-gray-900">{application.gradeSpecificInfo.highSchoolInfo.highSchoolName || '未填写'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">高考成绩</label>
                  <p className="text-gray-900">{application.gradeSpecificInfo.highSchoolInfo.gaokaoScore || '未填写'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">编程经验</label>
                  <p className="text-gray-900">
                    {application.gradeSpecificInfo.highSchoolInfo.hasCodeExperience ? '有编程经验' : '无编程经验'}
                  </p>
                </div>
                {application.gradeSpecificInfo.highSchoolInfo.codeExperienceDesc && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">编程经验描述</label>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-gray-900">{application.gradeSpecificInfo.highSchoolInfo.codeExperienceDesc}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {application.grade === '大二' && application.gradeSpecificInfo.sophomoreInfo && (
            <div className="space-y-4">
              <h3 className="font-medium text-lg">大二学习情况</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">GPA</label>
                  <p className="text-gray-900">{application.gradeSpecificInfo.sophomoreInfo.gpa || '未填写'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">是否转专业</label>
                  <p className="text-gray-900">
                    {application.gradeSpecificInfo.sophomoreInfo.isTransferStudent === 'true' ? '是' : '否'}
                  </p>
                </div>
                {application.gradeSpecificInfo.sophomoreInfo.isTransferStudent === 'true' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">原专业</label>
                      <p className="text-gray-900">{application.gradeSpecificInfo.sophomoreInfo.originalMajor || '未填写'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">现专业</label>
                      <p className="text-gray-900">{application.gradeSpecificInfo.sophomoreInfo.newMajor || '未填写'}</p>
                    </div>
                  </>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">C/C++编程成绩</label>
                  <p className="text-gray-900">{application.gradeSpecificInfo.sophomoreInfo.programmingGrade || '未填写'}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 面试信息 */}
      {application.interview && (
        <div className="neumorphic-card">
          <h2 className="text-xl font-semibold mb-6 flex items-center">
            <CalendarIcon className="w-6 h-6 mr-2 text-primary-600" />
            面试信息
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">面试时间</label>
              <p className="text-gray-900">
                {format(new Date(application.interview.scheduledAt), 'yyyy-MM-dd HH:mm', { locale: zhCN })}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">面试地点</label>
              <p className="text-gray-900">
                {application.interview.room.name} ({application.interview.room.location})
              </p>
            </div>
            {application.interview.isCompleted && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">面试结果</label>
                  <p className="text-gray-900">
                    {application.interview.result === 'passed' ? '通过' : 
                     application.interview.result === 'failed' ? '未通过' : '待评分'}
                  </p>
                </div>
                {application.interview.interviewerNotes && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">面试官备注</label>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-gray-900">{application.interview.interviewerNotes}</p>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* 审核备注 */}
      {application.reviewNotes && (
        <div className="neumorphic-card">
          <h2 className="text-xl font-semibold mb-6">审核备注</h2>
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <p className="text-gray-900 whitespace-pre-wrap">{application.reviewNotes}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApplicationDetail;