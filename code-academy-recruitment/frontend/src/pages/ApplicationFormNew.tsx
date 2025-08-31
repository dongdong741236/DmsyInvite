import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { applicationService } from '../services/application.service';
import { ApplicationFormData, ApplicationConfig } from '../types';
import { 
  ExclamationCircleIcon,
  PhotoIcon,
  DocumentArrowUpIcon,
  InformationCircleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

const ApplicationFormNew: React.FC = () => {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [config, setConfig] = useState<ApplicationConfig | null>(null);
  const [selectedGrade, setSelectedGrade] = useState<string>('');

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ApplicationFormData>();

  const watchedGrade = watch('grade');

  // 加载申请配置
  useEffect(() => {
    loadConfig();
  }, []);

  // 监听年级变化
  useEffect(() => {
    setSelectedGrade(watchedGrade);
  }, [watchedGrade]);

  const loadConfig = async () => {
    try {
      console.log('=== 加载申请配置 ===');
      const response = await fetch('/api/applications/config');
      const configData = await response.json();
      console.log('申请配置数据:', configData);
      setConfig(configData);
    } catch (error) {
      console.error('Failed to load config:', error);
    }
  };

  const onSubmit = async (data: ApplicationFormData) => {
    try {
      setError('');
      setLoading(true);

      // 创建 FormData 以支持文件上传
      const formData = new FormData();
      
      // 添加基本字段
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null && !(value instanceof File)) {
          if (typeof value === 'object') {
            formData.append(key, JSON.stringify(value));
          } else {
            formData.append(key, value.toString());
          }
        }
      });

      // 添加文件
      if (data.personalPhoto) {
        formData.append('personalPhoto', data.personalPhoto);
      }
      if (data.studentCardPhoto) {
        formData.append('studentCardPhoto', data.studentCardPhoto);
      }
      if (data.experienceAttachment) {
        formData.append('experienceAttachment', data.experienceAttachment);
      }

      // 使用 fetch 发送 FormData
      const response = await fetch('/api/applications', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '提交失败');
      }

      setSuccess(true);
      setTimeout(() => {
        navigate('/applications');
      }, 2000);
    } catch (err: any) {
      setError(err.message || '提交失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (fieldName: string, file: File | null) => {
    if (file) {
      setValue(fieldName as keyof ApplicationFormData, file as any);
    }
  };

  // 申请提交成功页面
  if (success) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="neumorphic-card p-8 max-w-md text-center">
          <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-4">申请提交成功！</h2>
          <p className="text-gray-600 mb-4">
            您的申请已成功提交，我们会尽快审核。
          </p>
          <p className="text-sm text-gray-500">2秒后自动跳转到申请列表...</p>
        </div>
      </div>
    );
  }

  // 检查申请是否开放
  console.log('=== 检查申请开放状态 ===');
  console.log('配置对象:', config);
  if (config) {
    console.log('大一开放状态:', config.freshmanEnabled);
    console.log('大二开放状态:', config.sophomoreEnabled);
    console.log('判断结果:', !config.freshmanEnabled && !config.sophomoreEnabled);
  }
  
  if (config && !config.freshmanEnabled && !config.sophomoreEnabled) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="neumorphic-card text-center py-12">
          <InformationCircleIcon className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-4">申请暂未开放</h2>
          <p className="text-gray-600">
            当前申请通道暂未开放，请关注后续通知。
          </p>
          <div className="mt-4 text-sm text-gray-500">
            <p>调试信息：</p>
            <p>大一开放: {config.freshmanEnabled ? '是' : '否'}</p>
            <p>大二开放: {config.sophomoreEnabled ? '是' : '否'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">提交申请</h1>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
          <ExclamationCircleIcon className="w-5 h-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {config && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-semibold text-blue-800 mb-2">申请须知</h3>
          <ul className="text-blue-700 text-sm space-y-1">
            <li>• 当前开放年级：{config.allowedGrades.filter(grade => 
              (grade === '大一' && config.freshmanEnabled) || 
              (grade === '大二' && config.sophomoreEnabled)
            ).join('、')}</li>
            {config.deadline && (
              <li>• 申请截止时间：{new Date(config.deadline).toLocaleString('zh-CN')}</li>
            )}
            <li>• 请如实填写所有信息，提交后无法修改</li>
            <li>• 照片和附件大小不超过 5MB</li>
          </ul>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* 基本信息 */}
        <div className="neumorphic-card">
          <h2 className="text-xl font-semibold mb-6">基本信息</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                学号 <span className="text-red-500">*</span>
              </label>
              <input
                {...register('studentId', {
                  required: '请输入学号',
                  pattern: {
                    value: /^\d{8,12}$/,
                    message: '请输入有效的学号（8-12位数字）',
                  },
                })}
                type="text"
                className="neumorphic-input"
                placeholder="20210001"
              />
              {errors.studentId && (
                <p className="mt-1 text-sm text-red-600">{errors.studentId.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                手机号 <span className="text-red-500">*</span>
              </label>
              <input
                {...register('phone', {
                  required: '请输入手机号',
                  pattern: {
                    value: /^1[3-9]\d{9}$/,
                    message: '请输入有效的手机号',
                  },
                })}
                type="tel"
                className="neumorphic-input"
                placeholder="13800138000"
              />
              {errors.phone && (
                <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                专业 <span className="text-red-500">*</span>
              </label>
              <input
                {...register('major', {
                  required: '请输入专业',
                })}
                type="text"
                className="neumorphic-input"
                placeholder="计算机科学与技术"
              />
              {errors.major && (
                <p className="mt-1 text-sm text-red-600">{errors.major.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                年级 <span className="text-red-500">*</span>
              </label>
              <select
                {...register('grade', {
                  required: '请选择年级',
                })}
                className="neumorphic-input"
              >
                <option value="">请选择</option>
                {config?.freshmanEnabled && <option value="大一">大一</option>}
                {config?.sophomoreEnabled && <option value="大二">大二</option>}
              </select>
              {errors.grade && (
                <p className="mt-1 text-sm text-red-600">{errors.grade.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* 照片上传 */}
        <div className="neumorphic-card">
          <h2 className="text-xl font-semibold mb-6">照片信息</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                个人照片 <span className="text-red-500">*</span>
              </label>
              <div className="neumorphic-input p-4">
                <div className="flex items-center justify-center">
                  <PhotoIcon className="w-8 h-8 text-gray-400 mr-2" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange('personalPhoto', e.target.files?.[0] || null)}
                    className="text-sm text-gray-500"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">支持 JPG、PNG 格式，大小不超过 5MB</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                一卡通照片 <span className="text-red-500">*</span>
              </label>
              <div className="neumorphic-input p-4">
                <div className="flex items-center justify-center">
                  <PhotoIcon className="w-8 h-8 text-gray-400 mr-2" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange('studentCardPhoto', e.target.files?.[0] || null)}
                    className="text-sm text-gray-500"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">请上传清晰的一卡通照片</p>
              </div>
            </div>
          </div>
        </div>

        {/* 年级特定信息 */}
        {selectedGrade && (
          <div className="neumorphic-card">
            <h2 className="text-xl font-semibold mb-6">
              {selectedGrade === '大一' ? '高中背景信息' : '大一学习情况'}
            </h2>
            
            {selectedGrade === '大一' && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    高中学校 <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register('gradeSpecificInfo.highSchoolInfo.highSchoolName', {
                      required: selectedGrade === '大一' ? '请输入高中学校' : false,
                    })}
                    type="text"
                    className="neumorphic-input"
                    placeholder="XX市第一中学"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    高考分数
                  </label>
                  <input
                    {...register('gradeSpecificInfo.highSchoolInfo.gaokaoScore', {
                      valueAsNumber: true,
                      min: { value: 0, message: '分数不能为负数' },
                      max: { value: 750, message: '分数不能超过750' },
                    })}
                    type="number"
                    className="neumorphic-input"
                    placeholder="650"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    是否接触过编程？
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        {...register('gradeSpecificInfo.highSchoolInfo.hasCodeExperience', {
                          setValueAs: (value) => value === 'true'
                        })}
                        type="radio"
                        value="true"
                        className="mr-2"
                      />
                      是，有编程基础
                    </label>
                    <label className="flex items-center">
                      <input
                        {...register('gradeSpecificInfo.highSchoolInfo.hasCodeExperience', {
                          setValueAs: (value) => value === 'false'
                        })}
                        type="radio"
                        value="false"
                        className="mr-2"
                      />
                      否，完全没有接触过
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    编程经历描述
                  </label>
                  <textarea
                    {...register('gradeSpecificInfo.highSchoolInfo.codeExperienceDesc')}
                    rows={3}
                    className="neumorphic-input"
                    placeholder="请描述您的编程学习经历，如参加过的竞赛、自学的语言、做过的项目等..."
                  />
                </div>
              </div>
            )}

            {selectedGrade === '大二' && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    大一绩点 <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register('gradeSpecificInfo.sophomoreInfo.gpa', {
                      required: selectedGrade === '大二' ? '请输入大一绩点' : false,
                      valueAsNumber: true,
                      min: { value: 0, message: '绩点不能为负数' },
                      max: { value: 4.0, message: '绩点不能超过4.0' },
                    })}
                    type="number"
                    step="0.01"
                    className="neumorphic-input"
                    placeholder="3.5"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    是否转专业？
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        {...register('gradeSpecificInfo.sophomoreInfo.isTransferStudent', {
                          setValueAs: (value) => value === 'true'
                        })}
                        type="radio"
                        value="true"
                        className="mr-2"
                      />
                      是，我是转专业学生
                    </label>
                    <label className="flex items-center">
                      <input
                        {...register('gradeSpecificInfo.sophomoreInfo.isTransferStudent', {
                          setValueAs: (value) => value === 'false'
                        })}
                        type="radio"
                        value="false"
                        className="mr-2"
                      />
                      否，一直是本专业
                    </label>
                  </div>
                </div>

                {watch('gradeSpecificInfo.sophomoreInfo.isTransferStudent') === true && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        原专业
                      </label>
                      <input
                        {...register('gradeSpecificInfo.sophomoreInfo.originalMajor')}
                        type="text"
                        className="neumorphic-input"
                        placeholder="请输入转专业前的专业"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        现专业
                      </label>
                      <input
                        {...register('gradeSpecificInfo.sophomoreInfo.newMajor')}
                        type="text"
                        className="neumorphic-input"
                        placeholder="请输入转专业后的专业"
                      />
                    </div>
                  </>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      C语言课程成绩
                    </label>
                    <select
                      {...register('gradeSpecificInfo.sophomoreInfo.cLanguageGrade')}
                      className="neumorphic-input"
                    >
                      <option value="">请选择</option>
                      <option value="A">A (90-100)</option>
                      <option value="B">B (80-89)</option>
                      <option value="C">C (70-79)</option>
                      <option value="D">D (60-69)</option>
                      <option value="F">F (60以下)</option>
                      <option value="未修读">未修读此课程</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      C++课程成绩
                    </label>
                    <select
                      {...register('gradeSpecificInfo.sophomoreInfo.cppLanguageGrade')}
                      className="neumorphic-input"
                    >
                      <option value="">请选择</option>
                      <option value="A">A (90-100)</option>
                      <option value="B">B (80-89)</option>
                      <option value="C">C (70-79)</option>
                      <option value="D">D (60-69)</option>
                      <option value="F">F (60以下)</option>
                      <option value="未修读">未修读此课程</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 个人介绍 */}
        <div className="neumorphic-card">
          <h2 className="text-xl font-semibold mb-6">个人介绍</h2>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                自我介绍 <span className="text-red-500">*</span>
              </label>
              <textarea
                {...register('introduction', {
                  required: '请输入自我介绍',
                  minLength: {
                    value: 50,
                    message: '自我介绍至少需要50个字符',
                  },
                })}
                rows={4}
                className="neumorphic-input"
                placeholder="请介绍一下自己，包括性格特点、兴趣爱好等..."
              />
              {errors.introduction && (
                <p className="mt-1 text-sm text-red-600">{errors.introduction.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                技能特长 <span className="text-red-500">*</span>
              </label>
              <textarea
                {...register('skills', {
                  required: '请输入技能特长',
                })}
                rows={3}
                className="neumorphic-input"
                placeholder="请列举您掌握的编程语言、框架、工具等..."
              />
              {errors.skills && (
                <p className="mt-1 text-sm text-red-600">{errors.skills.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                项目经验 <span className="text-red-500">*</span>
              </label>
              <textarea
                {...register('experience', {
                  required: '请输入项目经验',
                })}
                rows={4}
                className="neumorphic-input"
                placeholder="请介绍您参与过的项目、比赛或实践经历..."
              />
              {errors.experience && (
                <p className="mt-1 text-sm text-red-600">{errors.experience.message}</p>
              )}
              
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  佐证材料（可选）
                </label>
                <div className="neumorphic-input p-4">
                  <div className="flex items-center justify-center">
                    <DocumentArrowUpIcon className="w-8 h-8 text-gray-400 mr-2" />
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.jpg,.png,.gif"
                      onChange={(e) => handleFileChange('experienceAttachment', e.target.files?.[0] || null)}
                      className="text-sm text-gray-500"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    支持 PDF、Word 文档或图片，用于证明您的项目经验
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                加入动机 <span className="text-red-500">*</span>
              </label>
              <textarea
                {...register('motivation', {
                  required: '请输入加入动机',
                  minLength: {
                    value: 50,
                    message: '加入动机至少需要50个字符',
                  },
                })}
                rows={4}
                className="neumorphic-input"
                placeholder="请说明您为什么想加入代码书院，以及您的期望和目标..."
              />
              {errors.motivation && (
                <p className="mt-1 text-sm text-red-600">{errors.motivation.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                作品链接（选填）
              </label>
              <input
                {...register('portfolio')}
                type="url"
                className="neumorphic-input"
                placeholder="GitHub、个人网站或其他作品展示链接"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate('/applications')}
            className="neumorphic-button text-gray-600"
          >
            取消
          </button>
          <button
            type="submit"
            disabled={loading}
            className="neumorphic-button bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '提交中...' : '提交申请'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ApplicationFormNew;