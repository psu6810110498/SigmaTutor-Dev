"use client";

import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useCallback, useRef, useEffect, useState } from 'react';

export function useMarketplaceFilters() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();

    // Get current state from URL
    const rootCategoryId = searchParams.get('root');      // Quick Filter (parent)
    const categoryId = searchParams.get('categoryId');    // Subject (child)
    const levelId = searchParams.get('levelId');
    const tutorId = searchParams.get('tutorId');
    const courseType = searchParams.get('courseType');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const sort = searchParams.get('sort') || 'newest';
    const search = searchParams.get('search') || '';

    // Debounced search
    const [searchInput, setSearchInput] = useState(search);
    const debounceRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        setSearchInput(search);
    }, [search]);

    // Helper to update multiple params at once
    const updateParams = useCallback(
        (updates: Record<string, string | null>) => {
            const params = new URLSearchParams(searchParams.toString());
            for (const [key, value] of Object.entries(updates)) {
                if (value === null) params.delete(key);
                else params.set(key, value);
            }
            router.push(pathname + '?' + params.toString(), { scroll: false });
        },
        [searchParams, router, pathname]
    );

    // Helper to update single param
    const createQueryString = useCallback(
        (name: string, value: string | null) => {
            const params = new URLSearchParams(searchParams.toString());
            if (value === null) params.delete(name);
            else params.set(name, value);
            return params.toString();
        },
        [searchParams]
    );

    // Actions
    const setRootCategory = (id: string | null) => {
        // When changing root, clear child category
        updateParams({ root: id, categoryId: null });
    };

    const setCategory = (id: string | null) => {
        router.push(pathname + '?' + createQueryString('categoryId', id), { scroll: false });
    };

    const setLevel = (id: string | null) => {
        router.push(pathname + '?' + createQueryString('levelId', id), { scroll: false });
    };

    const setCourseType = (type: string | null) => {
        router.push(pathname + '?' + createQueryString('courseType', type), { scroll: false });
    };

    const setPriceRange = (min: number | null, max: number | null) => {
        const params = new URLSearchParams(searchParams.toString());
        if (min !== null) params.set('minPrice', min.toString()); else params.delete('minPrice');
        if (max !== null) params.set('maxPrice', max.toString()); else params.delete('maxPrice');
        router.push(pathname + '?' + params.toString(), { scroll: false });
    };

    const toggleTutor = (id: string) => {
        if (tutorId === id) {
            router.push(pathname + '?' + createQueryString('tutorId', null), { scroll: false });
        } else {
            router.push(pathname + '?' + createQueryString('tutorId', id), { scroll: false });
        }
    };

    const setSort = (value: string) => {
        router.push(pathname + '?' + createQueryString('sort', value), { scroll: false });
    };

    // Debounced search (300ms)
    const setSearch = (value: string | null) => {
        setSearchInput(value || '');
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            const params = new URLSearchParams(searchParams.toString());
            if (value) params.set('search', value);
            else params.delete('search');
            params.delete('page');
            router.push(pathname + '?' + params.toString(), { scroll: false });
        }, 300);
    };

    const clearAll = () => {
        setSearchInput('');
        router.push(pathname);
    };

    return {
        // State
        rootCategoryId,
        categoryId,
        levelId,
        tutorId,
        courseType,
        minPrice,
        maxPrice,
        sort,
        search,
        searchInput,

        // Actions
        setRootCategory,
        setCategory,
        setLevel,
        setCourseType,
        setPriceRange,
        toggleTutor,
        setSort,
        setSearch,
        clearAll,
    };
}
