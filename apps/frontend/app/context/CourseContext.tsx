"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface Course {
  id: number;
  title: string;
  price: number;
  image: string;
  category?: string;
  level?: string;
  instructor?: string;
}

export const ALL_COURSES: Course[] = [
  { id: 1, title: "ฟิสิกส์ A-Level (ฉบับแม่นยำ)", price: 2499, image: "/course-placeholder-1.jpg", category: "ฟิสิกส์", level: "ม.ปลาย", instructor: "อ.โรเบิร์ต" },
  { id: 2, title: "คณิตศาสตร์ ม.ปลาย (Calculus)", price: 2890, image: "/course-placeholder-2.jpg", category: "คณิตศาสตร์", level: "ม.ปลาย", instructor: "ครูพี่แอน" },
  { id: 3, title: "เคมี อินทรีย์ (Organic Chem)", price: 3200, image: "/course-placeholder-3.jpg", category: "เคมี", level: "มหาวิทยาลัย", instructor: "ดร.สมศักดิ์" },
  { id: 4, title: "ภาษาอังกฤษ IELTS Preparation", price: 4500, image: "/course-placeholder-4.jpg", category: "ภาษาอังกฤษ", level: "ทั่วไป", instructor: "Teacher Sarah" },
  { id: 5, title: "ชีววิทยา ม.4: เซลล์และโครงสร้าง", price: 1200, image: "/course-placeholder-5.jpg", category: "ชีววิทยา", level: "ม.4", instructor: "อ.วิชัย" },
  { id: 6, title: "พื้นฐานบัญชีเบื้องต้น", price: 890, image: "/course-placeholder-6.jpg", category: "บัญชี", level: "ทั่วไป", instructor: "พี่เมย์ บัญชี" },
];

interface CourseContextType {
  cartItems: Course[];
  wishlistItems: Course[];
  addToCart: (course: Course) => void;
  removeFromCart: (id: number) => void;
  addToWishlist: (course: Course) => void;
  removeFromWishlist: (id: number) => void;
  isInCart: (id: number) => boolean;
  isInWishlist: (id: number) => boolean;
}

const CourseContext = createContext<CourseContextType | undefined>(undefined);

export function CourseProvider({ children }: { children: ReactNode }) {
  const [cartItems, setCartItems] = useState<Course[]>([]);
  const [wishlistItems, setWishlistItems] = useState<Course[]>([]);

  useEffect(() => {
    const savedCart = localStorage.getItem('sigma_cart');
    const savedWishlist = localStorage.getItem('sigma_wishlist');
    if (savedCart) setCartItems(JSON.parse(savedCart));
    if (savedWishlist) setWishlistItems(JSON.parse(savedWishlist));
  }, []);

  useEffect(() => {
    localStorage.setItem('sigma_cart', JSON.stringify(cartItems));
    localStorage.setItem('sigma_wishlist', JSON.stringify(wishlistItems));
  }, [cartItems, wishlistItems]);

  const addToCart = (course: Course) => {
    if (!cartItems.find(item => item.id === course.id)) {
      setCartItems([...cartItems, course]);
    }
  };

  const removeFromCart = (id: number) => {
    setCartItems(cartItems.filter(item => item.id !== id));
  };

  const addToWishlist = (course: Course) => {
    if (!wishlistItems.find(item => item.id === course.id)) {
      setWishlistItems([...wishlistItems, course]);
    }
  };

  const removeFromWishlist = (id: number) => {
    setWishlistItems(wishlistItems.filter(item => item.id !== id));
  };

  const isInCart = (id: number) => cartItems.some(item => item.id === id);
  const isInWishlist = (id: number) => wishlistItems.some(item => item.id === id);

  return (
    <CourseContext.Provider value={{ cartItems, wishlistItems, addToCart, removeFromCart, addToWishlist, removeFromWishlist, isInCart, isInWishlist }}>
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