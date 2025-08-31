import multer from 'multer';
import path from 'path';
import fs from 'fs';

// 确保上传目录存在
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// 配置存储
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let subDir = 'others';
    
    if (file.fieldname === 'personalPhoto') {
      subDir = 'photos/personal';
    } else if (file.fieldname === 'studentCardPhoto') {
      subDir = 'photos/student-cards';
    } else if (file.fieldname === 'experienceAttachment') {
      subDir = 'attachments';
    }
    
    const fullPath = path.join(uploadDir, subDir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
    }
    
    cb(null, fullPath);
  },
  filename: (req, file, cb) => {
    // 生成唯一文件名
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  },
});

// 文件过滤器
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (file.fieldname === 'personalPhoto' || file.fieldname === 'studentCardPhoto') {
    // 照片文件：只允许图片
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('只允许上传图片文件'));
    }
  } else if (file.fieldname === 'experienceAttachment') {
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
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 3, // 最多3个文件
  },
});

// 多文件上传中间件
export const uploadApplicationFiles = upload.fields([
  { name: 'personalPhoto', maxCount: 1 },
  { name: 'studentCardPhoto', maxCount: 1 },
  { name: 'experienceAttachment', maxCount: 1 },
]);