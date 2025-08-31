// 文件URL工具函数

const getBackendBaseUrl = () => {
  // 在生产环境中，直接使用后端端口
  const currentHost = window.location.hostname;
  const backendPort = process.env.REACT_APP_BACKEND_PORT || '45000';
  return `http://${currentHost}:${backendPort}`;
};

export const getFileUrl = (filePath: string | undefined): string | null => {
  if (!filePath) return null;
  
  // 确保路径不以斜杠开头
  const cleanPath = filePath.startsWith('/') ? filePath.slice(1) : filePath;
  const fullUrl = `${getBackendBaseUrl()}/uploads/${cleanPath}`;
  
  console.log('文件URL生成:', filePath, '->', fullUrl);
  
  return fullUrl;
};

export const getFileUrls = (filePaths: string[] | undefined): string[] => {
  if (!filePaths || filePaths.length === 0) return [];
  
  return filePaths.map(path => getFileUrl(path)).filter(Boolean) as string[];
};

export default { getFileUrl, getFileUrls };