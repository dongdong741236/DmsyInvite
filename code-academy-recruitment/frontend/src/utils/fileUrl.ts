// 文件URL工具函数

export const getFileUrl = (filePath: string | undefined): string | null => {
  if (!filePath) return null;
  
  // 确保路径不以斜杠开头
  const cleanPath = filePath.startsWith('/') ? filePath.slice(1) : filePath;
  
  // 使用相对路径，通过Nginx代理转发（像API一样）
  const fullUrl = `/uploads/${cleanPath}`;
  
  console.log('文件URL生成（代理转发）:', filePath, '->', fullUrl);
  
  return fullUrl;
};

export const getFileUrls = (filePaths: string[] | undefined): string[] => {
  if (!filePaths || filePaths.length === 0) return [];
  
  return filePaths.map(path => getFileUrl(path)).filter(Boolean) as string[];
};

export default { getFileUrl, getFileUrls };