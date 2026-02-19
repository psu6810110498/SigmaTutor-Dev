'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { Course as APICourse } from '@/app/lib/types';

// Cart item — uses string IDs to match database UUIDs
export interface CartItem {
  id: string;
  title: string;
  price: number;
  image: string;
  category?: string;
  level?: string;
  instructor?: string;
}

/**
 * Convert an API Course object to a CartItem for the shopping cart
 */
export function toCartItem(course: APICourse): CartItem {
  return {
    id: course.id,
    title: course.title,
    price: course.price,
    image: course.thumbnail || course.thumbnailSm || '/course-placeholder.jpg',
    category: course.category?.name,
    level: course.level?.name,
    instructor: course.instructor?.name,
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
  clearCart: () => void;
}

const CourseContext = createContext<CourseContextType | undefined>(undefined);

export function CourseProvider({ children }: { children: ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [wishlistItems, setWishlistItems] = useState<CartItem[]>([]);

  useEffect(() => {
    // Filter out old cart items that used numeric IDs (from mock data era)
    const isValidItem = (item: CartItem) => typeof item.id === 'string' && item.id.length > 5;

    const savedCart = localStorage.getItem('sigma_cart');
    const savedWishlist = localStorage.getItem('sigma_wishlist');
    if (savedCart) {
      const parsed = JSON.parse(savedCart) as CartItem[];
      const valid = parsed.filter(isValidItem);
      setCartItems(valid);
      // Clean up invalid entries
      if (valid.length !== parsed.length) localStorage.setItem('sigma_cart', JSON.stringify(valid));
    }
    if (savedWishlist) {
      const parsed = JSON.parse(savedWishlist) as CartItem[];
      const valid = parsed.filter(isValidItem);
      setWishlistItems(valid);
      if (valid.length !== parsed.length)
        localStorage.setItem('sigma_wishlist', JSON.stringify(valid));
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
