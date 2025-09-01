// 文件URL工具函数

export const getFileUrl = (filePath: string | undefined): string | null => {
  if (!filePath) return null;
  
  // 确保路径不以斜杠开头
  const cleanPath = filePath.startsWith('/') ? filePath.slice(1) : filePath;
  
  // 临时方案：直接访问后端，使用动态域名
  const currentHost = window.location.hostname;
  const protocol = window.location.protocol;
  const backendPort = '45000'; // 后端端口
  const fullUrl = `${protocol}//${currentHost}:${backendPort}/uploads/${cleanPath}`;
  
  console.log('文件URL生成（直连后端）:', filePath, '->', fullUrl);
  
  return fullUrl;
};

export const getFileUrls = (filePaths: string[] | undefined): string[] => {
  if (!filePaths || filePaths.length === 0) return [];
  
  return filePaths.map(path => getFileUrl(path)).filter(Boolean) as string[];
};

export default { getFileUrl, getFileUrls };