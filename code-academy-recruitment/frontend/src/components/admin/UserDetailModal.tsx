import React from 'react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { User } from '../../types';
import {
  XMarkIcon,
  UserIcon,
  EnvelopeIcon,
  CalendarIcon,
  ShieldCheckIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';

interface UserDetailModalProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
}

const UserDetailModal: React.FC<UserDetailModalProps> = ({ user, isOpen, onClose }) => {
  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold flex items-center">
            <UserIcon className="w-6 h-6 mr-2 text-primary-600" />
            用户详情
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* 基本信息 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                用户姓名
              </label>
              <div className="flex items-center">
                <UserIcon className="w-4 h-4 text-gray-400 mr-2" />
                <span className="text-gray-900">{user.name}</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                邮箱地址
              </label>
              <div className="flex items-center">
                <EnvelopeIcon className="w-4 h-4 text-gray-400 mr-2" />
                <span className="text-gray-900">{user.email}</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                用户角色
              </label>
              <div className="flex items-center">
                {user.role === 'admin' ? (
                  <>
                    <ShieldCheckIcon className="w-4 h-4 text-purple-600 mr-2" />
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      管理员
                    </span>
                  </>
                ) : (
                  <>
                    <UserIcon className="w-4 h-4 text-blue-600 mr-2" />
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      申请者
                    </span>
                  </>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                用户状态
              </label>
              <div className="flex items-center space-x-4">
                {user.isActive ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    <CheckCircleIcon className="w-3 h-3 mr-1" />
                    正常
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    <XCircleIcon className="w-3 h-3 mr-1" />
                    已禁用
                  </span>
                )}
                
                {user.isEmailVerified ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    <CheckCircleIcon className="w-3 h-3 mr-1" />
                    邮箱已验证
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    <XCircleIcon className="w-3 h-3 mr-1" />
                    邮箱未验证
                  </span>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                注册时间
              </label>
              <div className="flex items-center">
                <CalendarIcon className="w-4 h-4 text-gray-400 mr-2" />
                <span className="text-gray-900">
                  {user.createdAt ? format(new Date(user.createdAt), 'yyyy-MM-dd HH:mm:ss', { locale: zhCN }) : '未知'}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                最后更新
              </label>
              <div className="flex items-center">
                <CalendarIcon className="w-4 h-4 text-gray-400 mr-2" />
                <span className="text-gray-900">
                  {user.updatedAt ? format(new Date(user.updatedAt), 'yyyy-MM-dd HH:mm:ss', { locale: zhCN }) : '未知'}
                </span>
              </div>
            </div>
          </div>
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

export default UserDetailModal;