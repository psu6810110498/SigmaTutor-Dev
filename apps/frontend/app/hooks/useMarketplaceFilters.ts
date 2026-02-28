"use client";

import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useCallback, useRef, useEffect, useState } from 'react';

export function useMarketplaceFilters() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();

    // Read filter state from URL params
    const rootCategoryId = searchParams.get('root');
    const categoryId = searchParams.get('categoryId');
    const levelId = searchParams.get('levelId');
    const tutorId = searchParams.get('tutorId');
    const courseType = searchParams.get('courseType');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const sort = searchParams.get('sort') || 'newest';
    const search = searchParams.get('search') || '';

    // Controlled input value for the search field (debounced)
    const [searchInput, setSearchInput] = useState(search);
    const debounceRef = useRef<NodeJS.Timeout | null>(null);

    // Keep searchInput in sync with the URL state
    useEffect(() => {
        setSearchInput(search);
    }, [search]);

    /**
     * Updates multiple URL search params at once while preserving existing params.
     * Reads from window.location to avoid stale closure issues with router state.
     */
    const updateParams = useCallback(
        (updates: Record<string, string | null>) => {
            const currentSearch = typeof window !== 'undefined'
                ? window.location.search
                : searchParams.toString();
            const params = new URLSearchParams(currentSearch);

            for (const [key, value] of Object.entries(updates)) {
                if (value === null) params.delete(key);
                else params.set(key, value);
            }
            router.push(pathname + '?' + params.toString(), { scroll: false });
        },
        [searchParams, router, pathname]
    );

    /** Returns a new query string with a single param updated */
    const createQueryString = useCallback(
        (name: string, value: string | null) => {
            const params = new URLSearchParams(searchParams.toString());
            if (value === null) params.delete(name);
            else params.set(name, value);
            return params.toString();
        },
        [searchParams]
    );

    // ── Filter Actions ─────────────────────────────────────

    /** Select a root (QuickFilter) category. Clears child category automatically. */
    const setRootCategory = useCallback(
        (id: string | null) => updateParams({ root: id, categoryId: null }),
        [updateParams]
    );

    const setCategory = useCallback(
        (id: string | null) => router.push(pathname + '?' + createQueryString('categoryId', id), { scroll: false }),
        [router, pathname, createQueryString]
    );

    const setLevel = useCallback(
        (id: string | null) => router.push(pathname + '?' + createQueryString('levelId', id), { scroll: false }),
        [router, pathname, createQueryString]
    );

    const setCourseType = useCallback(
        (type: string | null) => router.push(pathname + '?' + createQueryString('courseType', type), { scroll: false }),
        [router, pathname, createQueryString]
    );

    const setPriceRange = useCallback(
        (min: number | null, max: number | null) => {
            const params = new URLSearchParams(searchParams.toString());
            if (min !== null) params.set('minPrice', min.toString()); else params.delete('minPrice');
            if (max !== null) params.set('maxPrice', max.toString()); else params.delete('maxPrice');
            router.push(pathname + '?' + params.toString(), { scroll: false });
        },
        [router, pathname, searchParams]
    );

    const toggleTutor = useCallback(
        (id: string) => {
            const next = tutorId === id ? null : id;
            router.push(pathname + '?' + createQueryString('tutorId', next), { scroll: false });
        },
        [router, pathname, createQueryString, tutorId]
    );

    /** Debounced search — updates input immediately, URL after 300ms */
    const setSearch = useCallback(
        (value: string | null) => {
            setSearchInput(value ?? '');
            if (debounceRef.current) clearTimeout(debounceRef.current);
            debounceRef.current = setTimeout(() => {
                const params = new URLSearchParams(searchParams.toString());
                if (value) params.set('search', value); else params.delete('search');
                params.delete('page');
                router.push(pathname + '?' + params.toString(), { scroll: false });
            }, 300);
        },
        [router, pathname, searchParams]
    );

    const clearAll = useCallback(() => {
        setSearchInput('');
        router.push(pathname);
    }, [router, pathname]);

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
        setSearch,
        clearAll,
    };
}
