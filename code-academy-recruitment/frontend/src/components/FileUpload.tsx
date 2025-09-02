import React, { useState, useRef } from 'react';
import api from '../services/api';
import {
  CloudArrowUpIcon,
  DocumentIcon,
  PhotoIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';

interface FileUploadProps {
  label: string;
  accept?: string;
  multiple?: boolean;
  maxSize?: number; // MB
  maxFiles?: number;
  value?: File | File[];
  onChange: (files: File | File[] | null) => void;
  onUploadComplete?: (filePaths: string | string[]) => void; // 上传完成回调
  error?: string;
  required?: boolean;
  description?: string;
  preview?: boolean;
  fieldName: string; // 字段名，用于上传
}

const FileUpload: React.FC<FileUploadProps> = ({
  label,
  accept = "*/*",
  multiple = false,
  maxSize = 10,
  maxFiles = 1,
  value,
  onChange,
  onUploadComplete,
  error,
  required = false,
  description,
  preview = false,
  fieldName,
}) => {
  const [dragOver, setDragOver] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const files = multiple 
    ? (Array.isArray(value) ? value : value ? [value] : [])
    : (value ? [value as File] : []);

  const validateFile = (file: File): string | null => {
    if (file.size > maxSize * 1024 * 1024) {
      return `文件大小不能超过 ${maxSize}MB`;
    }
    return null;
  };

  const uploadFiles = async (filesToUpload: File[]) => {
    if (filesToUpload.length === 0) return;

    try {
      setUploading(true);
      setUploadError('');

      const formData = new FormData();
      filesToUpload.forEach(file => {
        formData.append(fieldName, file);
      });

      console.log(`=== 上传文件到字段: ${fieldName} ===`);
      console.log('上传的文件:', filesToUpload.map(f => f.name));

      const response = await api.post('/applications/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log('上传响应:', response.data);

      if (response.data.files && response.data.files[fieldName]) {
        const uploadedPaths = response.data.files[fieldName];
        console.log('上传成功，文件路径:', uploadedPaths);
        
        if (onUploadComplete) {
          onUploadComplete(uploadedPaths);
        }
      }
    } catch (error) {
      console.error('文件上传失败:', error);
      setUploadError('文件上传失败，请重试');
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = (selectedFiles: FileList | null) => {
    if (!selectedFiles) return;

    const newFiles = Array.from(selectedFiles);
    const validFiles: File[] = [];
    const errors: string[] = [];

    for (const file of newFiles) {
      const error = validateFile(file);
      if (error) {
        errors.push(`${file.name}: ${error}`);
      } else {
        validFiles.push(file);
      }
    }

    if (errors.length > 0) {
      setUploadError(errors.join('; '));
      return;
    }

    setUploadError('');

    if (multiple) {
      const currentFiles = Array.isArray(value) ? value : [];
      const totalFiles = [...currentFiles, ...validFiles];
      
      if (totalFiles.length > maxFiles) {
        setUploadError(`最多只能上传 ${maxFiles} 个文件`);
        return;
      }
      
      onChange(totalFiles);
      // 立即上传多文件
      uploadFiles(validFiles);
    } else {
      onChange(validFiles[0] || null);
      // 立即上传单文件
      uploadFiles([validFiles[0]]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const removeFile = (index: number) => {
    if (multiple) {
      const currentFiles = Array.isArray(value) ? value : [];
      const newFiles = currentFiles.filter((_, i) => i !== index);
      onChange(newFiles.length > 0 ? newFiles : null);
    } else {
      onChange(null);
    }
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <PhotoIcon className="w-8 h-8 text-blue-500" />;
    }
    return <DocumentIcon className="w-8 h-8 text-gray-500" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getPreviewUrl = (file: File) => {
    if (file.type.startsWith('image/')) {
      return URL.createObjectURL(file);
    }
    return null;
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      
      {description && (
        <p className="text-sm text-gray-500">{description}</p>
      )}

      {/* 上传区域 */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-6 transition-colors ${
          dragOver
            ? 'border-primary-400 bg-primary-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
        />

        <div className="text-center">
          {uploading ? (
            <>
              <ArrowPathIcon className="w-12 h-12 text-primary-600 mx-auto mb-4 animate-spin" />
              <p className="text-lg font-medium text-primary-600 mb-2">
                正在上传文件...
              </p>
            </>
          ) : (
            <>
              <CloudArrowUpIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-900 mb-2">
                点击上传或拖拽文件到此处
              </p>
              <p className="text-sm text-gray-500">
                支持 {accept === 'image/*' ? '图片格式' : '常见文件格式'}，
                单个文件不超过 {maxSize}MB
                {multiple && `，最多 ${maxFiles} 个文件`}
              </p>
            </>
          )}
        </div>
      </div>

      {/* 已上传文件列表 */}
      {files.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">已选择文件：</p>
          {files.map((file, index) => (
            <div
              key={`${file.name}-${index}`}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
            >
              <div className="flex items-center space-x-3">
                {preview && getPreviewUrl(file) ? (
                  <img
                    src={getPreviewUrl(file)!}
                    alt={file.name}
                    className="w-12 h-12 object-cover rounded"
                  />
                ) : (
                  getFileIcon(file)
                )}
                <div>
                  <p className="text-sm font-medium text-gray-900 truncate max-w-xs">
                    {file.name}
                  </p>
                  <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <CheckCircleIcon className="w-5 h-5 text-green-500" />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(index);
                  }}
                  className="text-red-500 hover:text-red-700"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 错误提示 */}
      {(error || uploadError) && (
        <div className="flex items-start p-3 bg-red-50 border border-red-200 rounded-lg">
          <ExclamationTriangleIcon className="w-5 h-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-800">{error || uploadError}</p>
        </div>
      )}
    </div>
  );
};

export default FileUpload;