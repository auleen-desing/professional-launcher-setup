import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@/types/user';
import { apiService } from '@/services/api';

interface LoginResult {
  success: boolean;
  error?: string;
  needsVerification?: boolean;
  email?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAdmin: boolean;
  login: (username: string, password: string) => Promise<LoginResult>;
  logout: () => void;
  updateCoins: (newCoins: number) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Development mode flag - set to false in production
const DEV_MODE = false;

// Mock user for development only
const mockUser: User = {
  id: '1',
  username: 'Auleen',
  email: 'auleen@novaera.com',
  coins: 8000123,
  createdAt: new Date().toISOString(),
  authority: 100,
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      if (DEV_MODE) {
        // Development: check localStorage
        const savedUser = localStorage.getItem('novaera_user');
        if (savedUser) {
          setUser(JSON.parse(savedUser));
        }
      } else {
        // Production: verify session with API
        const token = localStorage.getItem('novaera_token');
        if (token) {
          const response = await apiService.getSession();
          if (response.success && response.data?.user) {
            const userData: User = {
              id: response.data.user.id,
              username: response.data.user.username,
              email: response.data.user.email,
              coins: response.data.user.coins,
              avatar: response.data.user.avatar,
              createdAt: response.data.user.createdAt,
              authority: response.data.user.authority || 0,
            };
            setUser(userData);
            localStorage.setItem('novaera_user', JSON.stringify(userData));
          } else {
            // Token invalid, clear storage
            localStorage.removeItem('novaera_token');
            localStorage.removeItem('novaera_user');
          }
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (username: string, password: string): Promise<LoginResult> => {
    try {
      if (DEV_MODE) {
        // Development: mock login
        setUser(mockUser);
        localStorage.setItem('novaera_user', JSON.stringify(mockUser));
        return { success: true };
      }

      // Production: real API call
      const response = await apiService.login(username, password);
      
      if (response.success && response.data?.user) {
        const userData: User = {
          id: response.data.user.id,
          username: response.data.user.username,
          email: response.data.user.email,
          coins: response.data.user.coins,
          avatar: response.data.user.avatar,
          createdAt: response.data.user.createdAt,
          authority: response.data.user.authority || 0,
        };
        setUser(userData);
        localStorage.setItem('novaera_user', JSON.stringify(userData));
        return { success: true };
      }

      // Check for email verification needed
      if (response.needsVerification) {
        return { 
          success: false, 
          error: response.error || 'Please verify your email.',
          needsVerification: true,
          email: response.email
        };
      }

      return { 
        success: false, 
        error: response.error || 'Login failed. Please check your credentials.' 
      };
    } catch (error) {
      console.error('Login failed:', error);
      return { 
        success: false, 
        error: 'Connection error. Please try again later.' 
      };
    }
  };

  const logout = async () => {
    try {
      if (!DEV_MODE) {
        await apiService.logout();
      }
    } catch (error) {
      console.error('Logout API call failed:', error);
    } finally {
      setUser(null);
      localStorage.removeItem('novaera_user');
      localStorage.removeItem('novaera_token');
    }
  };

  const updateCoins = (newCoins: number) => {
    if (user) {
      const updatedUser = { ...user, coins: newCoins };
      setUser(updatedUser);
      localStorage.setItem('novaera_user', JSON.stringify(updatedUser));
    }
  };

  const refreshUser = async () => {
    if (!DEV_MODE && user) {
      const response = await apiService.getProfile();
      if (response.success && response.data) {
        const updatedUser: User = {
          ...user,
          coins: response.data.coins,
          avatar: response.data.avatar,
        };
        setUser(updatedUser);
        localStorage.setItem('novaera_user', JSON.stringify(updatedUser));
      }
    }
  };

  const isAdmin = user ? user.authority >= 300 : false;

  return (
    <AuthContext.Provider value={{ user, isLoading, isAdmin, login, logout, updateCoins, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Safe accessor for components that can render outside the provider (e.g. public header)
export function useOptionalAuth() {
  return useContext(AuthContext);
}

