import api from './api';

export interface UploadResponse {
  files: {
    [fieldname: string]: string; // 相对路径
  };
}

export const uploadService = {
  async uploadFiles(files: { [fieldname: string]: File }): Promise<UploadResponse> {
    const formData = new FormData();
    
    Object.entries(files).forEach(([fieldname, file]) => {
      if (file) {
        formData.append(fieldname, file);
      }
    });

    const response = await api.post<UploadResponse>('/applications/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  },
};

export default uploadService;