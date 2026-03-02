import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import BannersPage from '../banners/page';
import { bannerApi } from '@/app/lib/api';

// Mock Modules
vi.mock('@/app/lib/api', () => ({
    bannerApi: {
        getAll: vi.fn(),
        getTrash: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        restore: vi.fn(),
        forceDelete: vi.fn(),
    }
}));

vi.mock('@/app/components/ui/Toast', () => ({
    useToast: () => ({
        toast: {
            success: vi.fn(),
            error: vi.fn()
        }
    })
}));

// Mock ConfirmDialog & PromptDialog to simplify UI testing
vi.mock('@/app/components/ui/ConfirmDialog', () => ({
    ConfirmDialog: ({ open, onConfirm, onCancel, title }: any) => (
        open ? (
            <div data-testid={`confirm-dialog-${title}`}>
                <button onClick={onConfirm}>Confirm</button>
                <button onClick={onCancel}>Cancel</button>
            </div>
        ) : null
    )
}));

vi.mock('@/app/components/ui/PromptDialog', () => ({
    PromptDialog: ({ open, onConfirm, onCancel, title }: any) => (
        open ? (
            <div data-testid={`prompt-dialog-${title}`}>
                <button onClick={onConfirm}>Confirm</button>
                <button onClick={onCancel}>Cancel</button>
            </div>
        ) : null
    )
}));

// Mock getBannerStatus so it doesn't break
vi.mock('../banners/page', async (importOriginal) => {
    const actual = await importOriginal();
    return actual;
});

const mockBanners = [
    {
        id: '1',
        title: 'Promotion Summer',
        subtitle: 'Sale up to 50%',
        imageUrl: 'https://example.com/banner1.jpg',
        imageUrlMobile: 'https://example.com/banner1-m.jpg',
        linkUrl: null,
        position: 'EXPLORE_TOP',
        priority: 1,
        isActive: true,
        startDate: new Date().toISOString(),
        endDate: null
    },
    {
        id: '2',
        title: 'New Course Alert',
        subtitle: null,
        imageUrl: null,
        imageUrlMobile: null,
        linkUrl: '/courses/123',
        position: 'EXPLORE_MIDDLE',
        priority: 2,
        isActive: false,
        startDate: new Date().toISOString(),
        endDate: null
    }
];

describe('Banners Admin Page', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders loading state initially', () => {
        vi.mocked(bannerApi.getAll).mockResolvedValue(new Promise(() => { }));
        render(<BannersPage />);
        expect(screen.getByText(/Loading/i)).toBeInTheDocument();
    });

    it('fetches and displays a list of banners', async () => {
        vi.mocked(bannerApi.getAll).mockResolvedValue({ success: true, data: mockBanners });

        render(<BannersPage />);

        await waitFor(() => {
            expect(screen.getByText('Promotion Summer')).toBeInTheDocument();
        });

        expect(screen.getByText('Sale up to 50%')).toBeInTheDocument();
        expect(screen.getByText('New Course Alert')).toBeInTheDocument();

        // Mobile layout testing elements
        const priorityTags = screen.getAllByText(/#1/);
        expect(priorityTags.length).toBeGreaterThan(0);
    });

    it('shows empty state when no banners exist', async () => {
        vi.mocked(bannerApi.getAll).mockResolvedValue({ success: true, data: [] });
        render(<BannersPage />);

        await waitFor(() => {
            expect(screen.getByText('ยังไม่มี Banner')).toBeInTheDocument();
        });
    });

    it('can toggle to trash mode and fetch soft-deleted banners', async () => {
        vi.mocked(bannerApi.getAll).mockResolvedValue({ success: true, data: [] });
        vi.mocked(bannerApi.getTrash).mockResolvedValue({ success: true, data: [mockBanners[0]] });

        render(<BannersPage />);

        const trashToggleBtn = screen.getByRole('button', { name: /รายการที่ถูกลบ/i });
        fireEvent.click(trashToggleBtn);

        await waitFor(() => {
            expect(bannerApi.getTrash).toHaveBeenCalledTimes(1);
            expect(screen.getByText('Banner ที่ถูกลบไปแล้ว')).toBeInTheDocument();
            expect(screen.getByText('Promotion Summer')).toBeInTheDocument();
        });
    });
});
