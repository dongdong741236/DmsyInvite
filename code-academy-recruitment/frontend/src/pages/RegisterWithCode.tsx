import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/auth.service';
import { RegisterData } from '../types';
import { 
  ExclamationCircleIcon, 
  CheckCircleIcon,
  EnvelopeIcon,
  ShieldCheckIcon,
  UserPlusIcon
} from '@heroicons/react/24/outline';

interface EmailStepData {
  email: string;
}

interface VerifyStepData {
  code: string;
}

interface RegisterStepData extends RegisterData {
  confirmPassword: string;
}

const RegisterWithCode: React.FC = () => {
  const navigate = useNavigate();
  const { register: registerUser } = useAuth();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [step, setStep] = useState<'email' | 'verify' | 'register'>('email');
  const [email, setEmail] = useState('');
  const [countdown, setCountdown] = useState(0);

  const allowedDomain = process.env.REACT_APP_ALLOWED_EMAIL_DOMAIN || '@stu.example.edu.cn';

  // 倒计时效果
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // 第一步：邮箱输入和验证码发送
  const {
    register: registerEmail,
    handleSubmit: handleEmailSubmit,
    formState: { errors: emailErrors },
  } = useForm<EmailStepData>();

  const onEmailSubmit = async (data: EmailStepData) => {
    try {
      setError('');
      setLoading(true);
      await authService.sendVerificationCode(data.email);
      setEmail(data.email);
      setStep('verify');
      setCountdown(60); // 60秒倒计时
    } catch (err: any) {
      setError(err.response?.data?.error || '发送验证码失败');
    } finally {
      setLoading(false);
    }
  };

  // 第二步：验证码验证
  const {
    register: registerVerify,
    handleSubmit: handleVerifySubmit,
    formState: { errors: verifyErrors },
    reset: resetVerify,
  } = useForm<VerifyStepData>();

  const onVerifySubmit = async (data: VerifyStepData) => {
    try {
      setError('');
      setLoading(true);
      await authService.verifyEmailCode(email, data.code);
      setStep('register');
    } catch (err: any) {
      setError(err.response?.data?.error || '验证码验证失败');
    } finally {
      setLoading(false);
    }
  };

  const resendCode = async () => {
    try {
      setError('');
      setLoading(true);
      await authService.sendVerificationCode(email);
      setCountdown(60);
      resetVerify();
    } catch (err: any) {
      setError(err.response?.data?.error || '重发验证码失败');
    } finally {
      setLoading(false);
    }
  };

  // 第三步：完成注册
  const {
    register: registerForm,
    handleSubmit: handleRegisterSubmit,
    watch,
    formState: { errors: registerErrors },
  } = useForm<RegisterStepData>();

  const password = watch('password');

  const onRegisterSubmit = async (data: RegisterStepData) => {
    try {
      setError('');
      setLoading(true);
      await registerUser(email, data.password, data.name);
      setSuccess(true);
      setTimeout(() => {
        navigate('/');
      }, 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || '注册失败');
    } finally {
      setLoading(false);
    }
  };

  // 渲染不同步骤
  const renderEmailStep = () => (
    <div className="neumorphic-card p-8">
      <div className="text-center mb-6">
        <EnvelopeIcon className="w-16 h-16 text-primary-600 mx-auto mb-4" />
        <h2 className="text-3xl font-bold">验证邮箱</h2>
        <p className="text-gray-600 mt-2">请输入您的校内邮箱地址</p>
      </div>

      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-blue-800 text-sm">
          注意：只有使用 <strong>{allowedDomain}</strong> 邮箱才能注册
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
          <ExclamationCircleIcon className="w-5 h-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      <form onSubmit={handleEmailSubmit(onEmailSubmit)} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            邮箱地址
          </label>
          <input
            {...registerEmail('email', {
              required: '请输入邮箱地址',
              pattern: {
                value: new RegExp(`^[A-Z0-9._%+-]+${allowedDomain.replace('.', '\\.')}$`, 'i'),
                message: `邮箱必须以 ${allowedDomain} 结尾`,
              },
            })}
            type="email"
            className="neumorphic-input"
            placeholder={`your.name${allowedDomain}`}
          />
          {emailErrors.email && (
            <p className="mt-1 text-sm text-red-600">{emailErrors.email.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full neumorphic-button bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50"
        >
          {loading ? '发送中...' : '发送验证码'}
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">
          已有账号？{' '}
          <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">
            立即登录
          </Link>
        </p>
      </div>
    </div>
  );

  const renderVerifyStep = () => (
    <div className="neumorphic-card p-8">
      <div className="text-center mb-6">
        <ShieldCheckIcon className="w-16 h-16 text-primary-600 mx-auto mb-4" />
        <h2 className="text-3xl font-bold">输入验证码</h2>
        <p className="text-gray-600 mt-2">
          我们已向 <strong>{email}</strong> 发送了验证码
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
          <ExclamationCircleIcon className="w-5 h-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      <form onSubmit={handleVerifySubmit(onVerifySubmit)} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            6位验证码
          </label>
          <input
            {...registerVerify('code', {
              required: '请输入验证码',
              pattern: {
                value: /^\d{6}$/,
                message: '验证码必须是6位数字',
              },
            })}
            type="text"
            maxLength={6}
            className="neumorphic-input text-center text-2xl tracking-widest"
            placeholder="123456"
          />
          {verifyErrors.code && (
            <p className="mt-1 text-sm text-red-600">{verifyErrors.code.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full neumorphic-button bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50"
        >
          {loading ? '验证中...' : '验证并继续'}
        </button>
      </form>

      <div className="mt-6 text-center space-y-2">
        <p className="text-sm text-gray-600">没有收到验证码？</p>
        {countdown > 0 ? (
          <p className="text-sm text-gray-500">
            {countdown} 秒后可重新发送
          </p>
        ) : (
          <button
            onClick={resendCode}
            disabled={loading}
            className="text-sm text-primary-600 hover:text-primary-700 disabled:opacity-50"
          >
            重新发送验证码
          </button>
        )}
        
        <div className="pt-2">
          <button
            onClick={() => setStep('email')}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            ← 返回修改邮箱
          </button>
        </div>
      </div>
    </div>
  );

  const renderRegisterStep = () => (
    <div className="neumorphic-card p-8">
      <div className="text-center mb-6">
        <UserPlusIcon className="w-16 h-16 text-primary-600 mx-auto mb-4" />
        <h2 className="text-3xl font-bold">完善信息</h2>
        <p className="text-gray-600 mt-2">
          邮箱 <strong>{email}</strong> 验证成功
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
          <ExclamationCircleIcon className="w-5 h-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      <form onSubmit={handleRegisterSubmit(onRegisterSubmit)} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            姓名
          </label>
          <input
            {...registerForm('name', {
              required: '请输入姓名',
              minLength: { value: 2, message: '姓名至少需要2个字符' },
            })}
            type="text"
            className="neumorphic-input"
            placeholder="请输入真实姓名"
          />
          {registerErrors.name && (
            <p className="mt-1 text-sm text-red-600">{registerErrors.name.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            密码
          </label>
          <input
            {...registerForm('password', {
              required: '请输入密码',
              minLength: { value: 6, message: '密码至少需要6个字符' },
              pattern: {
                value: /^(?=.*[a-zA-Z])(?=.*[0-9])/,
                message: '密码必须包含字母和数字',
              },
            })}
            type="password"
            className="neumorphic-input"
            placeholder="••••••••"
          />
          {registerErrors.password && (
            <p className="mt-1 text-sm text-red-600">{registerErrors.password.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            确认密码
          </label>
          <input
            {...registerForm('confirmPassword', {
              required: '请确认密码',
              validate: (value) => value === password || '两次输入的密码不一致',
            })}
            type="password"
            className="neumorphic-input"
            placeholder="••••••••"
          />
          {registerErrors.confirmPassword && (
            <p className="mt-1 text-sm text-red-600">{registerErrors.confirmPassword.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full neumorphic-button bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50"
        >
          {loading ? '注册中...' : '完成注册'}
        </button>
      </form>

      <div className="mt-6 text-center">
        <button
          onClick={() => setStep('verify')}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← 返回验证码输入
        </button>
      </div>
    </div>
  );

  // 注册成功页面
  if (success) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="neumorphic-card p-8 max-w-md text-center">
          <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-4">注册成功！</h2>
          <p className="text-gray-600 mb-4">
            欢迎加入代码书院实验室！
          </p>
          <p className="text-sm text-gray-500">3秒后自动跳转到首页...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-8">
      <div className="w-full max-w-md">
        {/* 步骤指示器 */}
        <div className="mb-8">
          <div className="flex justify-center space-x-4">
            {[
              { key: 'email', label: '验证邮箱', icon: EnvelopeIcon },
              { key: 'verify', label: '输入验证码', icon: ShieldCheckIcon },
              { key: 'register', label: '完成注册', icon: UserPlusIcon },
            ].map((stepInfo, index) => {
              const Icon = stepInfo.icon;
              const isActive = step === stepInfo.key;
              const isCompleted = 
                (step === 'verify' && stepInfo.key === 'email') ||
                (step === 'register' && ['email', 'verify'].includes(stepInfo.key));
              
              return (
                <div key={stepInfo.key} className="flex flex-col items-center">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    isCompleted ? 'bg-green-100 text-green-600' :
                    isActive ? 'bg-primary-100 text-primary-600' :
                    'bg-gray-100 text-gray-400'
                  }`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <p className={`text-xs mt-2 ${
                    isActive ? 'text-primary-600 font-medium' : 'text-gray-500'
                  }`}>
                    {stepInfo.label}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* 渲染当前步骤 */}
        {step === 'email' && renderEmailStep()}
        {step === 'verify' && renderVerifyStep()}
        {step === 'register' && renderRegisterStep()}
      </div>
    </div>
  );
};

export default RegisterWithCode;