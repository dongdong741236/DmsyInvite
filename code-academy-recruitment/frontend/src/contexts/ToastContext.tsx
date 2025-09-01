import React, { createContext, useContext, useState, useCallback } from 'react';
import ErrorToast from '../components/ErrorToast';

interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning';
  duration?: number;
  persistent?: boolean;
}

interface ToastContextType {
  showToast: (message: string, type?: 'success' | 'error' | 'warning', options?: {
    duration?: number;
    persistent?: boolean;
  }) => void;
  showError: (message: string, persistent?: boolean) => void;
  showSuccess: (message: string) => void;
  showWarning: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((
    message: string,
    type: 'success' | 'error' | 'warning' = 'error',
    options: { duration?: number; persistent?: boolean } = {}
  ) => {
    const id = Date.now().toString();
    const newToast: ToastMessage = {
      id,
      message,
      type,
      duration: options.duration || (type === 'error' ? 10000 : 5000), // 错误消息显示更久
      persistent: options.persistent || false,
    };

    setToasts(prev => [...prev, newToast]);
  }, []);

  const showError = useCallback((message: string, persistent = false) => {
    showToast(message, 'error', { persistent, duration: persistent ? undefined : 10000 });
  }, [showToast]);

  const showSuccess = useCallback((message: string) => {
    showToast(message, 'success', { duration: 4000 });
  }, [showToast]);

  const showWarning = useCallback((message: string) => {
    showToast(message, 'warning', { duration: 6000 });
  }, [showToast]);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, showError, showSuccess, showWarning }}>
      {children}
      {/* 渲染所有 Toast */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map((toast, index) => (
          <div
            key={toast.id}
            style={{
              transform: `translateY(${index * 10}px)`,
              zIndex: 1000 - index,
            }}
          >
            <ErrorToast
              message={toast.message}
              type={toast.type}
              duration={toast.duration}
              persistent={toast.persistent}
              onClose={() => removeToast(toast.id)}
            />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export default ToastProvider;