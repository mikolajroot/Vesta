import  { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authAPI, User } from '../services/api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string, role: 'Admin' | 'Child') => Promise<void>;
  logout: () => void;
  loading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const storedUser = localStorage.getItem('user');
    if (token && storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (err) {
        console.error('Failed to parse stored user:', err);
        localStorage.removeItem('user');
        localStorage.removeItem('access_token');
      }
    }
  }, []);


  const login = async (username: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await authAPI.login({ username, password });
      localStorage.setItem('access_token', response.data.access_token);

      const profileResponse = await authAPI.getProfile();
      setUser(profileResponse.data);
      localStorage.setItem('user', JSON.stringify(profileResponse.data));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (username: string, password: string, role: 'Admin' | 'Child') => {
    setLoading(true);
    setError(null);
    try {
      const response = await authAPI.register({ username, password, role  });
      localStorage.setItem('access_token', response.data.access_token);


      const profileResponse = await authAPI.getProfile();
      setUser(profileResponse.data);
      localStorage.setItem('user', JSON.stringify(profileResponse.data));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Registration failed';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
  };

  return (
    <AuthContext
      value={{
        user,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        loading,
        error,
      }}
    >
      {children}
    </AuthContext>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

