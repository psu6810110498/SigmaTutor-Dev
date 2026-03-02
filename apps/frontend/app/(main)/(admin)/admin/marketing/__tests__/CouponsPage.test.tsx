import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import CouponsPage from '../coupons/page';
import { couponApi } from '@/app/lib/api';

// Mock Modules
vi.mock('@/app/lib/api', () => ({
    couponApi: {
        list: vi.fn(),
        getTrash: vi.fn(),
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

// Mock standard window confirm and prompt in case they slipped through
global.confirm = vi.fn(() => true);
global.prompt = vi.fn(() => 'TESTCODE');

const mockCoupons = [
    {
        id: '1',
        code: 'SUMMER2026',
        discountType: 'PERCENTAGE',
        discountValue: 20,
        maxDiscount: 1000,
        minPurchase: null,
        startDate: new Date().toISOString(),
        endDate: null,
        usageLimit: 100,
        usedCount: 5,
        isOneTimeUse: false,
        isActive: true,
        applicableCourses: []
    },
    {
        id: '2',
        code: 'FIXED500',
        discountType: 'FIXED_AMOUNT',
        discountValue: 500,
        maxDiscount: null,
        minPurchase: 1000,
        startDate: new Date().toISOString(),
        endDate: null,
        usageLimit: null,
        usedCount: 0,
        isOneTimeUse: true,
        isActive: false,
        applicableCourses: []
    }
];

describe('Coupons Admin Page', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders loading state initially', () => {
        vi.mocked(couponApi.list).mockReturnValue(new Promise(() => { })); // pending promise
        render(<CouponsPage />);
        expect(screen.getByText(/กำลังโหลดข้อมูล/i)).toBeInTheDocument();
    });

    it('fetches and displays a list of coupons', async () => {
        vi.mocked(couponApi.list).mockResolvedValue({ success: true, data: mockCoupons });

        render(<CouponsPage />);

        await waitFor(() => {
            expect(screen.getByText('SUMMER2026')).toBeInTheDocument();
        });

        // Assertions for Coupon 1
        expect(screen.getByText(/ลด 20%/i)).toBeInTheDocument();
        expect(screen.getByText(/สูงสุด ฿1,000/i)).toBeInTheDocument();

        // Assertions for Coupon 2
        expect(screen.getByText('FIXED500')).toBeInTheDocument();
        expect(screen.getByText(/ลด 500 บาท/i)).toBeInTheDocument();
        expect(screen.getByText(/ขั้นต่ำ ฿1,000/i)).toBeInTheDocument();
    });

    it('shows empty state when no coupons exist', async () => {
        vi.mocked(couponApi.list).mockResolvedValue({ success: true, data: [] });
        render(<CouponsPage />);

        await waitFor(() => {
            expect(screen.getByText('ไม่มีข้อมูลคูปองส่วนลดในระบบ')).toBeInTheDocument();
        });
    });

    it('can toggle to trash mode and fetch soft-deleted coupons', async () => {
        vi.mocked(couponApi.list).mockResolvedValue({ success: true, data: [] });
        vi.mocked(couponApi.getTrash).mockResolvedValue({ success: true, data: [mockCoupons[0]] });

        render(<CouponsPage />);

        // Click on Trash mode button
        const trashToggleBtn = screen.getByRole('button', { name: /รายการที่ถูกลบ/i });
        fireEvent.click(trashToggleBtn);

        await waitFor(() => {
            expect(couponApi.getTrash).toHaveBeenCalledTimes(1);
            expect(screen.getByText('คูปองส่วนลดที่ถูกลบไปแล้ว')).toBeInTheDocument();
            expect(screen.getByText('SUMMER2026')).toBeInTheDocument();
        });
    });
});
