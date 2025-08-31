export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'applicant';
  isEmailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Application {
  id: string;
  studentId: string;
  phone: string;
  major: string;
  grade: string;
  introduction: string;
  skills: string;
  experience: string;
  motivation: string;
  portfolio?: string;
  status: 'pending' | 'reviewing' | 'interview_scheduled' | 'interviewed' | 'accepted' | 'rejected';
  reviewNotes?: string;
  interview?: Interview;
  createdAt: string;
  updatedAt: string;
}

export interface Interview {
  id: string;
  scheduledAt: string;
  room: InterviewRoom;
  interviewerNotes?: string;
  evaluationScores?: {
    technical?: number;
    communication?: number;
    teamwork?: number;
    motivation?: number;
    overall?: number;
  };
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
  capacity: number;
  isActive: boolean;
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
  introduction: string;
  skills: string;
  experience: string;
  motivation: string;
  portfolio?: string;
}