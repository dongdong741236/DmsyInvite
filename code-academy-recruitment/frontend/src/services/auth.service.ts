import api from './api';
import { LoginData, RegisterData, User } from '../types';

export const authService = {
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
    window.location.href = '/login';
  },
};