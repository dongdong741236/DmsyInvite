import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useApplicationStatus } from '../hooks/useApplicationStatus';
import {
  AcademicCapIcon,
  UserGroupIcon,
  SparklesIcon,
  RocketLaunchIcon,
} from '@heroicons/react/24/outline';

const Home: React.FC = () => {
  const { user } = useAuth();
  // 只有登录用户才检查申请状态
  const { hasApplications, loading: applicationLoading } = useApplicationStatus(!!user);

  const features = [
    {
      icon: AcademicCapIcon,
      title: '专业指导',
      description: '由经验丰富的学长学姐提供技术指导和项目实践',
    },
    {
      icon: UserGroupIcon,
      title: '团队协作',
      description: '与志同道合的伙伴一起学习成长，共同进步',
    },
    {
      icon: SparklesIcon,
      title: '创新项目',
      description: '参与真实项目开发，将理论知识转化为实践能力',
    },
    {
      icon: RocketLaunchIcon,
      title: '职业发展',
      description: '获得实习和就业推荐机会，助力职业发展',
    },
  ];

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="text-center py-12">
        <h1 className="text-5xl font-bold mb-6">
          欢迎来到<span className="text-gradient">代码书院</span>
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
          代码书院实验室是一个充满活力的技术社区，致力于培养下一代优秀的开发者。
          加入我们，开启你的编程之旅！
        </p>
        
        {!user && (
          <div className="flex justify-center space-x-4">
            <Link
              to="/register"
              className="neumorphic-button bg-primary-600 text-white hover:bg-primary-700"
            >
              立即申请
            </Link>
            <Link
              to="/login"
              className="neumorphic-button text-primary-600"
            >
              登录账号
            </Link>
          </div>
        )}
        
        {user && !user.isEmailVerified && (
          <div className="neumorphic-card max-w-2xl mx-auto bg-yellow-50 border-yellow-200">
            <p className="text-yellow-800">
              请先验证您的邮箱地址，查看邮箱中的验证邮件。
            </p>
          </div>
        )}
      </section>

      {/* Features Section */}
      <section>
        <h2 className="text-3xl font-bold text-center mb-8">为什么选择代码书院？</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <div key={index} className="neumorphic-card hover:shadow-neumorphic-hover">
              <feature.icon className="w-12 h-12 text-primary-600 mb-4" />
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      {user && user.isEmailVerified && !applicationLoading && (
        <section className="text-center py-12 neumorphic-card">
          <h2 className="text-3xl font-bold mb-4">
            {hasApplications ? '申请管理' : '准备好了吗？'}
          </h2>
          <p className="text-lg text-gray-600 mb-6">
            {hasApplications 
              ? '查看您的申请状态和历史记录'
              : '立即提交你的申请，开始你的代码之旅'
            }
          </p>
          <Link
            to={hasApplications ? "/applications" : "/applications/new"}
            className="neumorphic-button bg-primary-600 text-white hover:bg-primary-700 inline-block"
          >
            {hasApplications ? '查看我的申请' : '提交申请'}
          </Link>
        </section>
      )}

      {/* Process Section */}
      <section>
        <h2 className="text-3xl font-bold text-center mb-8">申请流程</h2>
        <div className="max-w-4xl mx-auto">
          <div className="space-y-6">
            {[
              { step: 1, title: '注册账号', description: '使用校内邮箱注册账号并验证' },
              { step: 2, title: '填写申请', description: '完善个人信息和申请材料' },
              { step: 3, title: '等待审核', description: '我们会尽快审核您的申请' },
              { step: 4, title: '参加面试', description: '通过初审后参加线下面试' },
              { step: 5, title: '获得结果', description: '面试结束后通过邮件通知结果' },
            ].map((item) => (
              <div key={item.step} className="flex items-start">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold">
                  {item.step}
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold">{item.title}</h3>
                  <p className="text-gray-600">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;