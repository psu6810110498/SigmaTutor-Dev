"use client";

import { useState, useMemo, useCallback } from 'react';
import { Category } from '@/app/lib/types';

// Maps QuickFilter button labels to their DB slugs as a fallback lookup
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
 * Manages QuickFilter state and category resolution.
 * Derives root/child category lists from the full category list
 * and exposes a handler for filter label changes.
 */
export function useQuickFilter({
    categories,
    rootCategoryId,
    onRootCategoryChange,
    onCategoryChange,
    onLevelChange,
}: UseQuickFilterProps) {
    /** All top-level categories (no parent) */
    const rootCategories = useMemo(
        () => categories.filter(c => !c.parentId),
        [categories]
    );

    /** Children of the currently selected root category */
    const childCategories = useMemo(() => {
        if (!rootCategoryId) return [];
        return categories.filter(c => c.parentId === rootCategoryId);
    }, [categories, rootCategoryId]);

    /** Label for the active QuickFilter button (shown as selected) */
    const activeFilterLabel = useMemo(() => {
        if (!rootCategoryId) return "ทั้งหมด";
        const root = rootCategories.find(c => c.id === rootCategoryId);
        return root?.name ?? "ทั้งหมด";
    }, [rootCategoryId, rootCategories]);

    /**
     * Handles a QuickFilter button click.
     * Matches by category name first, then falls back to the slug map.
     */
    const handleQuickFilterChange = useCallback((label: string) => {
        const normalizedLabel = label.trim();

        // Guard: categories must be loaded before any filter can be resolved
        if (rootCategories.length === 0) return;

        // "ทั้งหมด" resets all filters
        if (normalizedLabel === "ทั้งหมด") {
            onRootCategoryChange(null);
            onCategoryChange(null);
            onLevelChange(null);
            return;
        }

        // Primary match: by display name
        const foundByName = rootCategories.find(c => c.name === normalizedLabel);
        if (foundByName) {
            onRootCategoryChange(foundByName.id);
            onCategoryChange(null);
            onLevelChange(null);
            return;
        }

        // Fallback match: by slug (handles label/name mismatches)
        const slugTarget = QUICK_FILTER_SLUG_MAP[normalizedLabel];
        if (slugTarget) {
            const foundBySlug = rootCategories.find(c => c.slug === slugTarget);
            if (foundBySlug) {
                onRootCategoryChange(foundBySlug.id);
                onCategoryChange(null);
                onLevelChange(null);
            }
        }
    }, [rootCategories, onRootCategoryChange, onCategoryChange, onLevelChange]);

    return {
        rootCategories,
        childCategories,
        activeFilterLabel,
        handleQuickFilterChange,
        /** True once categories have been loaded from the API */
        isReady: rootCategories.length > 0,
    };
}
