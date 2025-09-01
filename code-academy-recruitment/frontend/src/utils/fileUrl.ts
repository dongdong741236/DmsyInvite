// 文件URL工具函数

export const getFileUrl = (filePath: string | undefined): string | null => {
  if (!filePath) return null;
  
  // 清理路径：移除可能的错误前缀
  let cleanPath = filePath;
  
  // 移除可能的错误前缀
  if (cleanPath.startsWith('/uploads/')) {
    cleanPath = cleanPath.replace('/uploads/', '');
  }
  if (cleanPath.startsWith('uploads/')) {
    cleanPath = cleanPath.replace('uploads/', '');
  }
  if (cleanPath.startsWith('app/uploads/')) {
    cleanPath = cleanPath.replace('app/uploads/', '');
  }
  if (cleanPath.startsWith('/app/uploads/')) {
    cleanPath = cleanPath.replace('/app/uploads/', '');
  }
  
  // 确保路径不以斜杠开头
  cleanPath = cleanPath.startsWith('/') ? cleanPath.slice(1) : cleanPath;
  
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