'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { Course as APICourse } from '@/app/lib/types';

// ✅ ใช้ CartItem ตามกิ่ง main เพื่อรองรับ UUID (String) 
export interface CartItem {
  id: string;
  title: string;
  price: number;
  originalPrice?: number | null;
  image: string;
  category?: string;
  level?: string;
  instructor?: string;
  courseType?: 'ONLINE' | 'ONLINE_LIVE' | 'ONSITE';
  isBestSeller?: boolean;
}

/**
 * ฟังก์ชันแปลงข้อมูลจาก API เป็น Item สำหรับตะกร้าสินค้า
 */
export function toCartItem(course: APICourse): CartItem {
  return {
    id: course.id,
    title: course.title,
    // ถ้ามี promotionalPrice ให้ใช้เป็นราคาขายจริง (price) ส่วน originalPrice เก็บไว้แสดงขีดฆ่า
    price: course.promotionalPrice || course.price,
    originalPrice: course.originalPrice || course.price,
    image: course.thumbnail || course.thumbnailSm || '/course-placeholder.jpg',
    category: course.category?.name,
    level: course.level?.name,
    instructor: course.instructor?.name,
    courseType: course.courseType,
    isBestSeller: course.isBestSeller,
  };
}

interface CourseContextType {
  cartItems: CartItem[];
  wishlistItems: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (id: string) => void;
  addToWishlist: (item: CartItem) => void;
  removeFromWishlist: (id: string) => void;
  isInCart: (id: string) => boolean;
  isInWishlist: (id: string) => boolean;
  clearCart: () => void; // ✅ เพิ่มจากระบบ Payment ของเพื่อน
}

const CourseContext = createContext<CourseContextType | undefined>(undefined);

export function CourseProvider({ children }: { children: ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [wishlistItems, setWishlistItems] = useState<CartItem[]>([]);

  useEffect(() => {
    // โหลดข้อมูลจาก LocalStorage เมื่อเปิดหน้าเว็บ
    const savedCart = localStorage.getItem('sigma_cart');
    const savedWishlist = localStorage.getItem('sigma_wishlist');

    // ตรวจสอบข้อมูลเก่า (ถ้า ID เป็นตัวเลขให้กรองออกเพื่อป้องกันระบบพัง)
    const isValidItem = (item: CartItem) => typeof item.id === 'string' && item.id.length > 5;

    if (savedCart) {
      const parsed = JSON.parse(savedCart) as CartItem[];
      const valid = parsed.filter(isValidItem);
      setCartItems(valid);
    }
    if (savedWishlist) {
      const parsed = JSON.parse(savedWishlist) as CartItem[];
      const valid = parsed.filter(isValidItem);
      setWishlistItems(valid);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('sigma_cart', JSON.stringify(cartItems));
    localStorage.setItem('sigma_wishlist', JSON.stringify(wishlistItems));
  }, [cartItems, wishlistItems]);

  const addToCart = (item: CartItem) => {
    if (!cartItems.find((c) => c.id === item.id)) {
      setCartItems([...cartItems, item]);
    }
  };

  const removeFromCart = (id: string) => {
    setCartItems(cartItems.filter((item) => item.id !== id));
  };

  const addToWishlist = (item: CartItem) => {
    if (!wishlistItems.find((c) => c.id === item.id)) {
      setWishlistItems([...wishlistItems, item]);
    }
  };

  const removeFromWishlist = (id: string) => {
    setWishlistItems(wishlistItems.filter((item) => item.id !== id));
  };

  const isInCart = (id: string) => cartItems.some((item) => item.id === id);
  const isInWishlist = (id: string) => wishlistItems.some((item) => item.id === id);
  const clearCart = () => setCartItems([]);

  return (
    <CourseContext.Provider
      value={{
        cartItems,
        wishlistItems,
        addToCart,
        removeFromCart,
        addToWishlist,
        removeFromWishlist,
        isInCart,
        isInWishlist,
        clearCart,
      }}
    >
      {children}
    </CourseContext.Provider>
  );
}

export function useCourse() {
  const context = useContext(CourseContext);
  if (context === undefined) {
    throw new Error('useCourse must be used within a CourseProvider');
  }
  return context;
}