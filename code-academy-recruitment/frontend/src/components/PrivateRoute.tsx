import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface PrivateRouteProps {
  children: React.ReactElement;
  adminOnly?: boolean;
  interviewerAllowed?: boolean; // 允许面试官访问
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ 
  children, 
  adminOnly = false, 
  interviewerAllowed = false 
}) => {
  const { user, loading, isAdmin } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // 检查权限
  const isInterviewer = user.role === 'interviewer';
  
  if (adminOnly) {
    // 如果需要管理员权限
    if (interviewerAllowed) {
      // 允许管理员或面试官访问
      if (!isAdmin && !isInterviewer) {
        return <Navigate to="/" replace />;
      }
    } else {
      // 只允许管理员访问
      if (!isAdmin) {
        return <Navigate to="/" replace />;
      }
    }
  }

  return children;
};

export default PrivateRoute;