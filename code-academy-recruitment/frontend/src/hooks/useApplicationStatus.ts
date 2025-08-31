import { useState, useEffect } from 'react';
import api from '../services/api';
import { Application } from '../types';

export const useApplicationStatus = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasApplications, setHasApplications] = useState(false);

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    try {
      setLoading(true);
      const response = await api.get<Application[]>('/applications/my');
      setApplications(response.data);
      setHasApplications(response.data.length > 0);
    } catch (error) {
      console.error('Failed to load applications:', error);
      setApplications([]);
      setHasApplications(false);
    } finally {
      setLoading(false);
    }
  };

  return {
    applications,
    hasApplications,
    loading,
    refetch: loadApplications,
  };
};

export default useApplicationStatus;