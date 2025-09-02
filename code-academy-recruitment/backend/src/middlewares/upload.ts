import multer from 'multer';
import path from 'path';
import fs from 'fs';

// 确保上传目录存在（延迟创建，避免启动时权限问题）
const uploadDir = path.join(process.cwd(), 'uploads');

const ensureUploadDir = (subPath: string) => {
  const fullPath = path.join(uploadDir, subPath);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
  }
  return fullPath;
};

// 配置存储
const storage = multer.diskStorage({
  destination: (_req, file, cb) => {
    let subDir = 'others';
    
    if (file.fieldname === 'personalPhoto') {
      subDir = 'photos/personal';
    } else if (file.fieldname === 'studentCardPhoto') {
      subDir = 'photos/student-cards';
    } else if (file.fieldname === 'experienceAttachments') {
      subDir = 'attachments';
    }
    
    const fullPath = ensureUploadDir(subDir);
    cb(null, fullPath);
  },
  filename: (_req, file, cb) => {
    // 生成唯一文件名，处理中文文件名
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(Buffer.from(file.originalname, 'latin1').toString('utf8'));
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  },
});

// 文件过滤器
const fileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (file.fieldname === 'personalPhoto' || file.fieldname === 'studentCardPhoto') {
    // 照片文件：只允许图片
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('只允许上传图片文件'));
    }
  } else if (file.fieldname === 'experienceAttachments') {
    // 附件文件：允许常见文档格式
    const allowedMimes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png',
      'image/gif',
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('只允许上传 PDF、Word 文档或图片文件'));
    }
  } else {
    cb(new Error('未知的文件字段'));
  }
};

// 配置 multer
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 7, // 最多7个文件 (个人照片1 + 学生证1 + 佐证材料5)
  },
});

// 多文件上传中间件
export const uploadApplicationFiles = upload.fields([
  { name: 'personalPhoto', maxCount: 1 },
  { name: 'studentCardPhoto', maxCount: 1 },
  { name: 'experienceAttachments', maxCount: 5 },
]);