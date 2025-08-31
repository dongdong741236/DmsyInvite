import React, { useState } from 'react';
import { getFileUrl } from '../utils/fileUrl';
import {
  DocumentArrowDownIcon,
  DocumentTextIcon,
  EyeIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';

interface FileViewerProps {
  filePath: string | undefined;
  label: string;
  className?: string;
}

interface ImageModalProps {
  imageUrl: string;
  alt: string;
  isOpen: boolean;
  onClose: () => void;
}

const ImageModal: React.FC<ImageModalProps> = ({ imageUrl, alt, isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50" onClick={onClose}>
      <div className="relative max-w-4xl max-h-[90vh] p-4">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 bg-black bg-opacity-50 text-white rounded-full p-2 hover:bg-opacity-75"
        >
          <XMarkIcon className="w-6 h-6" />
        </button>
        <img
          src={imageUrl}
          alt={alt}
          className="max-w-full max-h-full object-contain rounded-lg"
          onClick={(e) => e.stopPropagation()}
        />
      </div>
    </div>
  );
};

const FileViewer: React.FC<FileViewerProps> = ({ filePath, label, className = "" }) => {
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const fileUrl = getFileUrl(filePath);

  if (!fileUrl) {
    return <span className="text-gray-400 text-sm">未上传</span>;
  }

  // 根据文件扩展名判断文件类型
  const getFileType = (url: string): 'image' | 'pdf' | 'document' | 'unknown' => {
    const extension = url.split('.').pop()?.toLowerCase();
    
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension || '')) {
      return 'image';
    }
    if (extension === 'pdf') {
      return 'pdf';
    }
    if (['doc', 'docx', 'txt', 'rtf'].includes(extension || '')) {
      return 'document';
    }
    return 'unknown';
  };

  const fileType = getFileType(fileUrl);
  const fileName = filePath?.split('/').pop() || label;

  // 图片文件 - 内嵌显示
  if (fileType === 'image') {
    return (
      <div className={`space-y-2 ${className}`}>
        <div className="relative group">
          <img
            src={fileUrl}
            alt={label}
            className="w-full max-w-xs h-32 object-cover rounded-lg border border-gray-200 cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => setImageModalOpen(true)}
          />
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded-lg flex items-center justify-center">
            <MagnifyingGlassIcon className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>
        <p className="text-xs text-gray-500 truncate max-w-xs">{fileName}</p>
        
        <ImageModal
          imageUrl={fileUrl}
          alt={label}
          isOpen={imageModalOpen}
          onClose={() => setImageModalOpen(false)}
        />
      </div>
    );
  }

  // PDF文件 - 新页面打开
  if (fileType === 'pdf') {
    return (
      <div className={`${className}`}>
        <a
          href={fileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-red-700 hover:bg-red-100 transition-colors"
        >
          <DocumentTextIcon className="w-5 h-5 mr-2" />
          <div className="text-left">
            <div className="text-sm font-medium">查看PDF</div>
            <div className="text-xs text-red-600 truncate max-w-32">{fileName}</div>
          </div>
          <EyeIcon className="w-4 h-4 ml-2" />
        </a>
      </div>
    );
  }

  // 其他文档文件 - 下载
  return (
    <div className={`${className}`}>
      <a
        href={fileUrl}
        download
        className="inline-flex items-center px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 hover:bg-blue-100 transition-colors"
      >
        <DocumentArrowDownIcon className="w-5 h-5 mr-2" />
        <div className="text-left">
          <div className="text-sm font-medium">下载文件</div>
          <div className="text-xs text-blue-600 truncate max-w-32">{fileName}</div>
        </div>
      </a>
    </div>
  );
};

export default FileViewer;