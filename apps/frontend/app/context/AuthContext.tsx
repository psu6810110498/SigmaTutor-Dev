"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';

// 1. สร้างโครงสร้างข้อมูล
export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  profileImage?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (userData: User) => void;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

// ⭐ จุดสำคัญ: ต้องประกาศบรรทัดนี้ไว้ "นอก" ฟังก์ชัน AuthProvider เพื่อให้หายแดงครับ
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const checkAuth = useCallback(async () => {
    try {
      const res = await fetch('http://localhost:4000/api/auth/me', {
        credentials: 'include', // Important!
      });
      const json = await res.json();

      if (res.ok && json.success) {
        setUser(json.data);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error("Auth Check Failed", error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Check auth on mount or when pathname changes (optional, but good for re-verification)
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = useCallback((userData: User) => {
    setUser(userData);
    // No need to set localStorage
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch('http://localhost:4000/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}), // Logout implementation might expect refreshToken, but cookie logout mainly clears cookies
      });
    } catch (e) {
      console.error("Logout error", e);
    }

    setUser(null);
    router.push('/login');
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