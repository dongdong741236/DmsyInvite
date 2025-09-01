import React, { useState } from 'react';
import { getFileUrl } from '../utils/fileUrl';

interface ImageDebuggerProps {
  filePath: string | undefined;
  label: string;
}

const ImageDebugger: React.FC<ImageDebuggerProps> = ({ filePath, label }) => {
  const [testResults, setTestResults] = useState<string[]>([]);
  
  if (!filePath) return <span className="text-gray-400">未上传</span>;

  const originalUrl = getFileUrl(filePath);
  
  // 生成多种可能的URL进行测试
  const testUrls = [
    originalUrl, // 原始URL
    `/uploads/${filePath}`, // 相对路径（通过前端代理）
    `http://localhost:45000/uploads/${filePath}`, // 直接后端localhost
    `${window.location.protocol}//${window.location.hostname}:45000/uploads/${filePath}`, // 动态协议
  ];

  const testUrl = async (url: string, index: number) => {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      const result = `${index + 1}. ${url} - ${response.ok ? '✅ 成功' : '❌ 失败 ' + response.status}`;
      setTestResults(prev => [...prev, result]);
    } catch (error) {
      const result = `${index + 1}. ${url} - ❌ 网络错误: ${error}`;
      setTestResults(prev => [...prev, result]);
    }
  };

  const runTests = () => {
    setTestResults([]);
    testUrls.forEach((url, index) => {
      if (url) testUrl(url, index);
    });
  };

  return (
    <div className="border p-4 rounded-lg bg-gray-50">
      <h4 className="font-medium mb-2">{label} - 调试信息</h4>
      
      <div className="space-y-2 text-sm">
        <div><strong>文件路径:</strong> {filePath}</div>
        <div><strong>生成的URL:</strong> {originalUrl}</div>
        <div><strong>当前域名:</strong> {window.location.hostname}</div>
        <div><strong>后端端口:</strong> {process.env.REACT_APP_BACKEND_PORT || '45000'}</div>
      </div>

      <button
        onClick={runTests}
        className="mt-3 px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
      >
        测试所有URL
      </button>

      {testResults.length > 0 && (
        <div className="mt-3 space-y-1 text-xs">
          <div className="font-medium">测试结果:</div>
          {testResults.map((result, index) => (
            <div key={index} className="font-mono">{result}</div>
          ))}
        </div>
      )}

      {/* 测试图片显示 */}
      <div className="mt-4">
        <div className="text-sm font-medium mb-2">图片显示测试:</div>
        {testUrls.map((url, index) => (
          url && (
            <div key={index} className="mb-2">
              <div className="text-xs text-gray-600">URL {index + 1}:</div>
              <img
                src={url}
                alt={`${label} - 测试${index + 1}`}
                className="w-20 h-20 object-cover border rounded"
                onLoad={() => console.log(`图片加载成功: ${url}`)}
                onError={() => console.log(`图片加载失败: ${url}`)}
              />
            </div>
          )
        ))}
      </div>
    </div>
  );
};

export default ImageDebugger;