import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@/types/user';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  updateCoins: (newCoins: number) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock user for development - replace with your API calls
const mockUser: User = {
  id: '1',
  username: 'Auleen',
  email: 'auleen@novaera.com',
  coins: 8000123,
  createdAt: new Date().toISOString(),
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session - replace with your API call
    const checkAuth = async () => {
      try {
        // TODO: Replace with your API endpoint
        // const response = await fetch('http://localhost:3000/api/auth/session');
        // const data = await response.json();
        // setUser(data.user);
        
        // Mock: Auto-login for development
        const savedUser = localStorage.getItem('novaera_user');
        if (savedUser) {
          setUser(JSON.parse(savedUser));
        }
      } catch (error) {
        console.error('Auth check failed:', error);
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      // TODO: Replace with your API endpoint
      // const response = await fetch('http://localhost:3000/api/auth/login', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ username, password }),
      // });
      // const data = await response.json();
      // if (data.success) {
      //   setUser(data.user);
      //   return true;
      // }
      
      // Mock login for development
      setUser(mockUser);
      localStorage.setItem('novaera_user', JSON.stringify(mockUser));
      return true;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    }
  };

  const logout = () => {
    // TODO: Call your logout API endpoint
    setUser(null);
    localStorage.removeItem('novaera_user');
  };

  const updateCoins = (newCoins: number) => {
    if (user) {
      const updatedUser = { ...user, coins: newCoins };
      setUser(updatedUser);
      localStorage.setItem('novaera_user', JSON.stringify(updatedUser));
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, updateCoins }}>
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
