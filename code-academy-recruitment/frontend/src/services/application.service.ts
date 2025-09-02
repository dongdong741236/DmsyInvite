import api from './api';
import { Application, ApplicationFormData } from '../types';

export const applicationService = {
  async getMyApplications() {
    const response = await api.get<Application[]>('/applications/my');
    return response.data;
  },

  async getApplication(id: string) {
    const response = await api.get<Application>(`/applications/${id}`);
    return response.data;
  },

  async createApplication(data: ApplicationFormData) {
    const response = await api.post<{
      message: string;
      application: Application;
    }>('/applications', data);
    return response.data;
  },

  async updateApplication(id: string, data: Partial<ApplicationFormData>) {
    const response = await api.put<{
      message: string;
      application: Application;
    }>(`/applications/${id}`, data);
    return response.data;
  },
};