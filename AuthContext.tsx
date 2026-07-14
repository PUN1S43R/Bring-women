import React, { createContext, useContext, useEffect, useState } from 'react';
import { authApi } from '../lib/api';

interface User {
  id: number;
  email: string;
  role: 'user' | 'admin' | 'superadmin';
}

interface AuthContextType {
  user: User | null;
  role: 'user' | 'admin' | 'superadmin' | null;
  loading: boolean;
  signOut: () => Promise<void>;
  setUser: (user: User | null) => void;
  setRole: (role: 'user' | 'admin' | 'superadmin' | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<'user' | 'admin' | 'superadmin' | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('auth_token');
      if (token) {
        try {
          const { data } = await authApi.getMe();
          setUser(data.user);
          setRole(data.user.role);
          localStorage.setItem('user_role', data.user.role);
        } catch (error) {
          console.error('Auth check failed:', error);
          localStorage.removeItem('auth_token');
          localStorage.removeItem('user_role');
          setUser(null);
          setRole(null);
        }
      } else {
        localStorage.removeItem('user_role');
        setRole(null);
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const signOut = async () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_role');
    setUser(null);
    setRole(null);
  };

  return (
    <AuthContext.Provider value={{ user, role, loading, signOut, setUser, setRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
