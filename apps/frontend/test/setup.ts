import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Shared spies — re-used across tests, cleared in beforeEach via vi.clearAllMocks()
export const mockRouterPush = vi.fn();
export const mockRouterReplace = vi.fn();
export const mockSearchParams = new URLSearchParams();

// ── Mock Next.js navigation ──────────────────────────────────────────────────
vi.mock('next/navigation', () => ({
    useRouter: () => ({
        push: mockRouterPush,
        replace: mockRouterReplace,
        prefetch: vi.fn(),
    }),
    useSearchParams: () => mockSearchParams,
    usePathname: () => '/explore',
}));

// Mock window.location
Object.defineProperty(window, 'location', {
    value: { search: '' },
    writable: true,
});
