import api from './api';
import { LoginData, RegisterData, User } from '../types';

export const authService = {
  async sendVerificationCode(email: string) {
    const response = await api.post<{
      message: string;
      expiresAt: string;
    }>('/auth/send-verification-code', { email });
    return response.data;
  },

  async verifyEmailCode(email: string, code: string) {
    const response = await api.post<{
      message: string;
      verified: boolean;
    }>('/auth/verify-email-code', { email, code });
    return response.data;
  },

  async login(data: LoginData) {
    const response = await api.post<{
      message: string;
      token: string;
      user: User;
    }>('/auth/login', data);
    
    const { token, user } = response.data;
    localStorage.setItem('token', token);
    return { token, user };
  },

  async register(data: RegisterData) {
    const response = await api.post<{
      message: string;
      token: string;
      user: User;
    }>('/auth/register', data);
    
    const { token, user } = response.data;
    localStorage.setItem('token', token);
    return { token, user };
  },

  async verifyEmail(token: string) {
    const response = await api.get(`/auth/verify-email?token=${token}`);
    return response.data;
  },

  async forgotPassword(email: string) {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },

  async resetPassword(token: string, password: string) {
    const response = await api.post('/auth/reset-password', { token, password });
    return response.data;
  },

  logout() {
    localStorage.removeItem('token');
    // 不使用window.location.href，让调用方处理重定向
  },
};