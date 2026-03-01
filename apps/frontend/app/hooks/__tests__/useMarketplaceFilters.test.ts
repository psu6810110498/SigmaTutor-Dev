import { renderHook, act } from '@testing-library/react';
import { useMarketplaceFilters } from '../useMarketplaceFilters';
import { mockRouterPush } from '../../../test/setup';
import { vi } from 'vitest';

// ─── Tests ───────────────────────────────────────────────────────────────────
describe('useMarketplaceFilters', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        window.location.search = '';
    });

    // ── 1. Initialization ─────────────────────────────────────────────────────
    it('initializes with empty values when no URL parameters exist', () => {
        const { result } = renderHook(() => useMarketplaceFilters());

        expect(result.current.rootCategoryId).toBeNull();
        expect(result.current.categoryId).toBeNull();
        expect(result.current.levelId).toBeNull();
        expect(result.current.search).toBe('');
        expect(result.current.sort).toBe('newest'); // default sort value
    });

    // ── 2. Root Category & Child Clear ────────────────────────────────────────
    it('setRootCategory updates root and clears child categoryId', () => {
        const { result } = renderHook(() => useMarketplaceFilters());

        act(() => {
            result.current.setRootCategory('ROOT_123');
        });

        expect(mockRouterPush).toHaveBeenCalledTimes(1);
        const calledUrl: string = mockRouterPush.mock.calls[0][0];

        expect(calledUrl).toContain('root=ROOT_123');
        // Both categoryId and tutorId should be cleared when switching root category
        expect(calledUrl).not.toContain('categoryId');
        expect(calledUrl).not.toContain('tutorId');
    });

    it('setRootCategory with null clears the root param', () => {
        const { result } = renderHook(() => useMarketplaceFilters());

        act(() => {
            result.current.setRootCategory(null);
        });

        expect(mockRouterPush).toHaveBeenCalledTimes(1);
        const calledUrl: string = mockRouterPush.mock.calls[0][0];
        expect(calledUrl).not.toContain('root=');
    });

    // ── 3. Debounced Search ───────────────────────────────────────────────────
    it('debounces search: updates input immediately but delays URL push by 300ms', () => {
        vi.useFakeTimers();

        const { result } = renderHook(() => useMarketplaceFilters());

        act(() => {
            result.current.setSearch('คณิต');
        });

        // searchInput should change immediately
        expect(result.current.searchInput).toBe('คณิต');
        // but router.push should NOT have been called yet
        expect(mockRouterPush).not.toHaveBeenCalled();

        // Advance timers past the 300ms debounce window
        act(() => { vi.advanceTimersByTime(300); });

        expect(mockRouterPush).toHaveBeenCalledTimes(1);
        expect(mockRouterPush.mock.calls[0][0]).toContain('search=');

        vi.useRealTimers();
    });

    it('cancels previous debounce if setSearch is called again within 300ms', () => {
        vi.useFakeTimers();

        const { result } = renderHook(() => useMarketplaceFilters());

        // Fire twice in quick succession
        act(() => { result.current.setSearch('a'); });
        act(() => { vi.advanceTimersByTime(100); }); // 100ms — debounce still pending
        act(() => { result.current.setSearch('ab'); }); // reset debounce

        act(() => { vi.advanceTimersByTime(300); }); // now debounce fires

        // Push should only have been called ONCE (the second call won)
        expect(mockRouterPush).toHaveBeenCalledTimes(1);
        expect(mockRouterPush.mock.calls[0][0]).toContain('search=ab');

        vi.useRealTimers();
    });

    // ── 4. clearAll ───────────────────────────────────────────────────────────
    it('clearAll resets search input and navigates to clean pathname', () => {
        const { result } = renderHook(() => useMarketplaceFilters());

        act(() => {
            result.current.clearAll();
        });

        expect(result.current.searchInput).toBe('');
        // Should push to just the pathname with no query string
        expect(mockRouterPush).toHaveBeenCalledWith('/explore');
    });
});
