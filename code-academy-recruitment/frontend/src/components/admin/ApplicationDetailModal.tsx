import React from 'react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { Application } from '../../types';
import FileViewer from '../FileViewer';
import {
  XMarkIcon,
  DocumentTextIcon,
  UserIcon,
  PhoneIcon,
  AcademicCapIcon,
  PhotoIcon,

  CalendarIcon,
} from '@heroicons/react/24/outline';

interface ApplicationDetailModalProps {
  application: Application | null;
  isOpen: boolean;
  onClose: () => void;
}

const ApplicationDetailModal: React.FC<ApplicationDetailModalProps> = ({ 
  application, 
  isOpen, 
  onClose 
}) => {
  if (!isOpen || !application) return null;

  const getStatusBadge = (status: Application['status']) => {
    const statusConfig: Record<Application['status'], { color: string; text: string }> = {
      pending: { color: 'bg-yellow-100 text-yellow-800', text: '待审核' },
      reviewing: { color: 'bg-blue-100 text-blue-800', text: '审核中' },
      approved: { color: 'bg-green-100 text-green-800', text: '审核通过' },
      interview_scheduled: { color: 'bg-purple-100 text-purple-800', text: '已安排面试' },
      interviewed: { color: 'bg-indigo-100 text-indigo-800', text: '已面试' },
      accepted: { color: 'bg-green-100 text-green-800', text: '已录取' },
      rejected: { color: 'bg-red-100 text-red-800', text: '未通过' },
    };

    const config = statusConfig[status];
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.text}
      </span>
    );
  };



  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold flex items-center">
            <DocumentTextIcon className="w-6 h-6 mr-2 text-primary-600" />
            申请详情
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-8">
          {/* 申请状态和基本信息 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                申请状态
              </label>
              <div>{getStatusBadge(application.status)}</div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                申请时间
              </label>
              <div className="flex items-center">
                <CalendarIcon className="w-4 h-4 text-gray-400 mr-2" />
                <span>{format(new Date(application.createdAt), 'yyyy-MM-dd HH:mm:ss', { locale: zhCN })}</span>
              </div>
            </div>
          </div>

          {/* 申请人信息 */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <UserIcon className="w-5 h-5 mr-2 text-primary-600" />
              申请人信息
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">姓名</label>
                <p className="text-gray-900">{application.user?.name || '未知'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">邮箱</label>
                <p className="text-gray-900">{application.user?.email || '未知'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">学号</label>
                <p className="text-gray-900">{application.studentId}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">一卡通号</label>
                <p className="text-gray-900">{application.campusCardId}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">手机号</label>
                <div className="flex items-center">
                  <PhoneIcon className="w-4 h-4 text-gray-400 mr-2" />
                  <span>{application.phone}</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">专业</label>
                <div className="flex items-center">
                  <AcademicCapIcon className="w-4 h-4 text-gray-400 mr-2" />
                  <span>{application.major}</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">年级</label>
                <p className="text-gray-900">{application.grade}</p>
              </div>
            </div>
          </div>

          {/* 上传文件 */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <PhotoIcon className="w-5 h-5 mr-2 text-primary-600" />
              上传文件
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">个人照片</label>
                <FileViewer filePath={application.personalPhoto} label="个人照片" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">学生证照片</label>
                <FileViewer filePath={application.studentCardPhoto} label="学生证照片" />
              </div>
            </div>
            
            {application.experienceAttachments && application.experienceAttachments.length > 0 && (
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">佐证材料</label>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {application.experienceAttachments.map((filePath, index) => (
                    <FileViewer 
                      key={index}
                      filePath={filePath} 
                      label={`佐证材料 ${index + 1}`}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 年级特定信息 */}
          {application.gradeSpecificInfo && (
            <div>
              <h3 className="text-lg font-semibold mb-4">年级特定信息</h3>
              
              {application.grade === '大一' && application.gradeSpecificInfo.highSchoolInfo && (
                <div className="space-y-4">
                  <h4 className="font-medium">高中信息</h4>
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
                        {application.gradeSpecificInfo.highSchoolInfo.hasCodeExperience ? '有' : '无'}
                      </p>
                    </div>
                    {application.gradeSpecificInfo.highSchoolInfo.codeExperienceDesc && (
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">编程经验描述</label>
                        <p className="text-gray-900">{application.gradeSpecificInfo.highSchoolInfo.codeExperienceDesc}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {application.grade === '大二' && application.gradeSpecificInfo.sophomoreInfo && (
                <div className="space-y-4">
                  <h4 className="font-medium">大二学生信息</h4>
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

          {/* 申请内容 */}
          <div>
            <h3 className="text-lg font-semibold mb-4">申请内容</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">自我介绍</label>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-gray-900 whitespace-pre-wrap">{application.introduction}</p>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">技能特长</label>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-gray-900 whitespace-pre-wrap">{application.skills}</p>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">项目经验</label>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-gray-900 whitespace-pre-wrap">{application.experience}</p>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">加入动机</label>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-gray-900 whitespace-pre-wrap">{application.motivation}</p>
                </div>
              </div>
              
              {application.portfolio && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">作品集链接</label>
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

          {/* 审核备注 */}
          {application.reviewNotes && (
            <div>
              <h3 className="text-lg font-semibold mb-4">审核备注</h3>
              <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                <p className="text-gray-900 whitespace-pre-wrap">{application.reviewNotes}</p>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="neumorphic-button text-gray-600"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
};

export default ApplicationDetailModal;