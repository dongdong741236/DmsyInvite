import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { authService } from '../services/auth.service';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  sendVerificationCode: (email: string) => Promise<{ message: string; expiresAt: string }>;
  verifyEmailCode: (email: string, code: string) => Promise<{ message: string; verified: boolean }>;
  logout: () => void;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // Decode JWT to get user info
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        // In a real app, you would validate the token with the server
        setUser({
          id: payload.userId,
          email: payload.email,
          name: payload.name || '',
          role: payload.role,
          isEmailVerified: true,
          isActive: true,
          createdAt: '',
          updatedAt: '',
        });
      } catch (error) {
        localStorage.removeItem('token');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const { user } = await authService.login({ email, password });
    setUser(user);
  };

  const register = async (email: string, password: string, name: string) => {
    const { user } = await authService.register({ email, password, name });
    setUser(user);
  };

  const sendVerificationCode = async (email: string) => {
    return await authService.sendVerificationCode(email);
  };

  const verifyEmailCode = async (email: string, code: string) => {
    return await authService.verifyEmailCode(email, code);
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    register,
    sendVerificationCode,
    verifyEmailCode,
    logout,
    isAdmin: user?.role === 'admin',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};