export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'applicant' | 'interviewer';
  isEmailVerified?: boolean;
  isActive: boolean;
  userType?: 'user' | 'interviewer';
  title?: string;
  department?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Application {
  id: string;
  studentId: string;
  phone: string;
  major: string;
  grade: string;
  personalPhoto?: string;
  studentCardPhoto?: string;
  introduction: string;
  skills: string;
  experience: string;
  experienceAttachments?: string[];
  motivation: string;
  portfolio?: string;
  gradeSpecificInfo?: any;
  status: 'pending' | 'reviewing' | 'approved' | 'interview_scheduled' | 'interviewed' | 'accepted' | 'rejected';
  reviewNotes?: string;
  interview?: Interview;
  user?: User;
  createdAt: string;
  updatedAt: string;
}

export interface Interview {
  id: string;
  scheduledAt: string;
  room: InterviewRoom;
  application?: Application;
  interviewerNotes?: string;
  evaluationScores?: {
    technical?: number;
    communication?: number;
    teamwork?: number;
    motivation?: number;
    overall?: number;
  };
  questionAnswers?: {
    questionId: string;
    question: string;
    answer: string;
    score?: number;
  }[];
  result: 'passed' | 'failed' | 'pending';
  isCompleted: boolean;
  notificationSent: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface InterviewRoom {
  id: string;
  name: string;
  location: string;
  isActive: boolean;
  interviewers?: {
    id: string;
    name: string;
    email: string;
    title?: string;
  }[];
}

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData extends LoginData {
  name: string;
}

export interface ApplicationFormData {
  studentId: string;
  phone: string;
  major: string;
  grade: string;
  personalPhoto?: File;
  studentCardPhoto?: File;
  introduction: string;
  skills: string;
  experience: string;
  experienceAttachments?: File[]; // 改为多文件
  motivation: string;
  portfolio?: string;
  gradeSpecificInfo?: {
    // 大一学生信息
    highSchoolInfo?: {
      highSchoolName?: string;
      gaokaoScore?: number;
      hasCodeExperience?: boolean;
      codeExperienceDesc?: string;
    };
    // 大二学生信息
    sophomoreInfo?: {
      gpa?: number;
      isTransferStudent?: string; // 'true' | 'false'
      originalMajor?: string;
      newMajor?: string;
      programmingGrade?: string; // 合并C/C++成绩
    };
  };
}

export interface ApplicationConfig {
  freshmanEnabled: boolean;
  sophomoreEnabled: boolean;
  deadline: string;
  startTime: string;
  allowedGrades: string[];
}