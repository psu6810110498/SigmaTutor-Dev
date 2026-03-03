"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

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
  const router = useRouter();

  const checkAuth = useCallback(async () => {
    try {
      const res = await fetch('http://localhost:4000/api/auth/me', {
        credentials: 'include',
      }).catch(() => null); 

      if (res && res.ok) {
        const json = await res.json();
        if (json.success) {
          setUser(json.data);
          localStorage.setItem('sigma_user', JSON.stringify(json.data));
        }
      } else if (res && res.status === 401) {
        setUser(null);
        localStorage.removeItem('sigma_user');
        localStorage.removeItem('sigma_cart');
        localStorage.removeItem('sigma_wishlist');
      }
    } catch (error) {
      console.error("Auth Check Failed");
    } finally {
      setLoading(false);
    }
  }, []);

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
      await fetch('http://localhost:4000/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      }).catch(() => null);
    } catch (e) {
      console.error("Logout error");
    }
    setUser(null);
    localStorage.removeItem('sigma_user');
    localStorage.removeItem('sigma_cart');
    localStorage.removeItem('sigma_wishlist');
    
    // Clear the cart application state by reloading or pushing and letting context trigger
    router.push('/login');
    setTimeout(() => window.location.reload(), 100);
  }, [router]);

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