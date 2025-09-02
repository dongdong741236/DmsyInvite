import React, { useState, useEffect } from 'react';
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'warning';
  duration?: number;
  onClose: () => void;
  persistent?: boolean;
}

const Toast: React.FC<ToastProps> = ({
  message,
  type,
  duration = 8000, // 默认8秒，比之前更长
  onClose,
  persistent = false,
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [remainingTime, setRemainingTime] = useState(duration);

  useEffect(() => {
    if (persistent) return; // 持久化消息不自动关闭

    const timer = setInterval(() => {
      setRemainingTime((prev) => {
        if (prev <= 100) {
          setIsVisible(false);
          setTimeout(onClose, 300); // 动画完成后关闭
          return 0;
        }
        return prev - 100;
      });
    }, 100);

    return () => clearInterval(timer);
  }, [duration, onClose, persistent]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircleIcon className="w-5 h-5 text-green-500 flex-shrink-0" />;
      case 'error':
        return <ExclamationTriangleIcon className="w-5 h-5 text-red-500 flex-shrink-0" />;
      case 'warning':
        return <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500 flex-shrink-0" />;
      default:
        return <CheckCircleIcon className="w-5 h-5 text-blue-500 flex-shrink-0" />;
    }
  };

  const getBackgroundColor = () => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  const getTextColor = () => {
    switch (type) {
      case 'success':
        return 'text-green-800';
      case 'error':
        return 'text-red-800';
      case 'warning':
        return 'text-yellow-800';
      default:
        return 'text-blue-800';
    }
  };

  const progressPercentage = persistent ? 100 : (remainingTime / duration) * 100;

  return (
    <div
      className={`fixed top-4 right-4 z-50 max-w-sm w-full mx-4 sm:mx-0 sm:max-w-md transition-all duration-300 transform ${
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      }`}
    >
      <div className={`rounded-lg border p-4 shadow-lg ${getBackgroundColor()}`}>
        <div className="flex items-start">
          {getIcon()}
          <div className="ml-3 flex-1">
            <p className={`text-sm font-medium ${getTextColor()}`}>
              {message}
            </p>
            {type === 'error' && !persistent && (
              <p className="mt-1 text-xs text-gray-600">
                点击右侧 × 可手动关闭，或等待自动关闭
              </p>
            )}
          </div>
          <button
            onClick={handleClose}
            className={`ml-4 inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
              type === 'success'
                ? 'text-green-400 hover:bg-green-100 focus:ring-green-600'
                : type === 'error'
                ? 'text-red-400 hover:bg-red-100 focus:ring-red-600'
                : 'text-yellow-400 hover:bg-yellow-100 focus:ring-yellow-600'
            }`}
          >
            <span className="sr-only">关闭</span>
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
        
        {/* 进度条 */}
        {!persistent && (
          <div className="mt-3 w-full bg-gray-200 rounded-full h-1">
            <div
              className={`h-1 rounded-full transition-all duration-100 ${
                type === 'success'
                  ? 'bg-green-500'
                  : type === 'error'
                  ? 'bg-red-500'
                  : 'bg-yellow-500'
              }`}
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

interface ErrorToastProps {
  message: string;
  type?: 'success' | 'error' | 'warning';
  duration?: number;
  persistent?: boolean;
  onClose?: () => void;
}

const ErrorToast: React.FC<ErrorToastProps> = ({
  message,
  type = 'error',
  duration = 8000,
  persistent = false,
  onClose = () => {},
}) => {
  const [showToast, setShowToast] = useState(!!message);

  useEffect(() => {
    setShowToast(!!message);
  }, [message]);

  const handleClose = () => {
    setShowToast(false);
    onClose();
  };

  if (!showToast || !message) {
    return null;
  }

  return (
    <Toast
      message={message}
      type={type}
      duration={duration}
      persistent={persistent}
      onClose={handleClose}
    />
  );
};

export default ErrorToast;