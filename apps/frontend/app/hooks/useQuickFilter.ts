"use client";

import { useState, useMemo, useCallback } from 'react';
import { Category } from '@/app/lib/types';

// Map Quick Filter labels to DB slugs for lookup
const QUICK_FILTER_SLUG_MAP: Record<string, string> = {
    "ประถม": "primary",
    "ม.ต้น": "middle-school",
    "ม.ปลาย": "high-school",
    "TCAS": "tcas",
    "SAT": "sat",
    "IELTS": "ielts",
};

interface UseQuickFilterProps {
    categories: Category[];
    rootCategoryId: string | null;
    onRootCategoryChange: (id: string | null) => void;
    onCategoryChange: (id: string | null) => void;
    onLevelChange: (id: string | null) => void;
}

/**
 * Custom hook สำหรับจัดการ QuickFilter
 * ใช้หลักการเดียวกับ create course page
 * Clean code + Performance optimized
 */
export function useQuickFilter({
    categories,
    rootCategoryId,
    onRootCategoryChange,
    onCategoryChange,
    onLevelChange,
}: UseQuickFilterProps) {
    // Root categories (parentId is null)
    const rootCategories = useMemo(
        () => categories.filter(c => !c.parentId),
        [categories]
    );

    // Child categories ของ root category ที่เลือก
    const childCategories = useMemo(() => {
        if (!rootCategoryId) return [];
        return categories.filter(c => c.parentId === rootCategoryId);
    }, [categories, rootCategoryId]);

    // Active QuickFilter label (สำหรับ UI)
    const activeFilterLabel = useMemo(() => {
        if (!rootCategoryId) return "ทั้งหมด";
        const root = rootCategories.find(c => c.id === rootCategoryId);
        return root?.name || "ทั้งหมด";
    }, [rootCategoryId, rootCategories]);

    /**
     * Handle QuickFilter click - Clean & Fast
     * ใช้หลักการเดียวกับ create course page
     */
    const handleQuickFilterChange = useCallback((label: string) => {
        const normalizedLabel = label.trim();

        // "ทั้งหมด" → clear all
        if (normalizedLabel === "ทั้งหมด") {
            onRootCategoryChange(null);
            onCategoryChange(null);
            onLevelChange(null);
            return;
        }

        // Find root category by name (fast lookup)
        const found = rootCategories.find(c => c.name === normalizedLabel);
        
        if (found) {
            // Set root category → child categories จะอัปเดตอัตโนมัติ
            onRootCategoryChange(found.id);
            onCategoryChange(null); // Clear child category
            onLevelChange(null); // Clear level
            return;
        }

        // Fallback: Try slug match (for cases where name might differ)
        const slugTarget = QUICK_FILTER_SLUG_MAP[normalizedLabel];
        if (slugTarget) {
            const foundBySlug = rootCategories.find(c => c.slug === slugTarget);
            if (foundBySlug) {
                onRootCategoryChange(foundBySlug.id);
                onCategoryChange(null);
                onLevelChange(null);
                return;
            }
        }
    }, [rootCategories, onRootCategoryChange, onCategoryChange, onLevelChange]);

    return {
        rootCategories,
        childCategories,
        activeFilterLabel,
        handleQuickFilterChange,
    };
}
