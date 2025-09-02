import React from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  HomeIcon,
  DocumentTextIcon,
  UserIcon,
  ArrowRightOnRectangleIcon,
  CogIcon,
} from '@heroicons/react/24/outline';

const Layout: React.FC = () => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navigation */}
      <nav className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="flex items-center">
                <h1 className="text-2xl font-bold text-gradient">代码书院</h1>
              </Link>
              
              <div className="hidden md:flex ml-10 space-x-4">
                <Link
                  to="/"
                  className="flex items-center px-3 py-2 rounded-lg text-gray-700 hover:text-primary-600 hover:bg-gray-50"
                >
                  <HomeIcon className="w-5 h-5 mr-2" />
                  首页
                </Link>
                
                {user && user.role === 'applicant' && (
                  <Link
                    to="/applications"
                    className="flex items-center px-3 py-2 rounded-lg text-gray-700 hover:text-primary-600 hover:bg-gray-50"
                  >
                    <DocumentTextIcon className="w-5 h-5 mr-2" />
                    我的申请
                  </Link>
                )}
                
                {user && user.role === 'interviewer' && (
                  <Link
                    to="/interviewer"
                    className="flex items-center px-3 py-2 rounded-lg text-gray-700 hover:text-primary-600 hover:bg-gray-50"
                  >
                    <DocumentTextIcon className="w-5 h-5 mr-2" />
                    面试管理
                  </Link>
                )}
                
                {isAdmin && (
                  <Link
                    to="/admin"
                    className="flex items-center px-3 py-2 rounded-lg text-gray-700 hover:text-primary-600 hover:bg-gray-50"
                  >
                    <CogIcon className="w-5 h-5 mr-2" />
                    管理后台
                  </Link>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {user ? (
                <>
                  <div className="flex items-center px-3 py-2 text-gray-700">
                    <UserIcon className="w-5 h-5 mr-2" />
                    <span>{user.name}</span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="flex items-center px-3 py-2 rounded-lg text-gray-700 hover:text-red-600 hover:bg-red-50"
                  >
                    <ArrowRightOnRectangleIcon className="w-5 h-5 mr-2" />
                    退出
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  className="neumorphic-button text-primary-600 font-medium"
                >
                  登录
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-white mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-gray-500">
            <p>&copy; 2024 代码书院实验室. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;