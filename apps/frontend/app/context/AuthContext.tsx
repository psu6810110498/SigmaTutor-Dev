"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useToast } from '@/app/components/ui/Toast';

// ✅ แก้ไข: เพิ่มฟิลด์เสริมเข้าไปใน Interface ให้ครบตาม Database
export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  profileImage?: string;
  phone?: string;
  address?: string;
  school?: string;
  educationLevel?: string;
  province?: string;
  birthday?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (userData: User) => void;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const checkAuth = useCallback(async () => {
    try {
      const res = await fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api') + '/auth/me', {
        credentials: 'include',
      }).catch(() => null);

      if (res && res.ok) {
        const json = await res.json();
        if (json.success) {
          setUser(json.data);
          localStorage.setItem('sigma_user', JSON.stringify(json.data));
        }
      } else if (res && res.status === 401) {
        const wasLoggedIn = !!localStorage.getItem('sigma_user');
        setUser(null);
        localStorage.removeItem('sigma_user');
        localStorage.removeItem('sigma_cart');
        localStorage.removeItem('sigma_wishlist');
        // Show notification only if they were previously logged in (avoids noise for guests/after intentional logout)
        if (wasLoggedIn) {
          toast.error('Session expired, please login again');
        }
      }
    } catch {
      console.error("Auth Check Failed");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    const savedUser = localStorage.getItem('sigma_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    checkAuth();
  }, [checkAuth]);

  const login = useCallback((userData: User) => {
    setUser(userData);
    localStorage.setItem('sigma_user', JSON.stringify(userData));
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api') + '/auth/logout', {
        method: 'POST',
        credentials: 'include',
      }).catch(() => null);
    } catch {
      console.error("Logout error");
    }
    setUser(null);
    localStorage.removeItem('sigma_user');
    localStorage.removeItem('sigma_cart');
    localStorage.removeItem('sigma_wishlist');

    // Clear the cart application state by securely navigating
    window.location.href = '/login';
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};