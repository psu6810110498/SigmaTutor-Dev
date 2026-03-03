'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Receipt,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  RotateCcw,
  ExternalLink,
} from 'lucide-react';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/app/components/ui/table';
import { Badge, type BadgeVariant } from '@/app/components/ui/badge';
import { Select } from '@/app/components/ui/select';
import { useToast } from '@/app/components/ui/Toast';

// ── Types ──────────────────────────────────────────────────

interface PaymentUser {
  id: string;
  name: string;
  email: string;
  profileImage: string | null;
}

interface PaymentCourse {
  id: string;
  title: string;
  slug: string;
  thumbnail: string | null;
}

interface PaymentCoupon {
  id: string;
  code: string;
  discountType: string;
  discountValue: number;
}

interface Payment {
  id: string;
  userId: string;
  courseId: string;
  amount: number;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
  stripeId: string | null;
  createdAt: string;
  user: PaymentUser;
  course: PaymentCourse;
  coupon: PaymentCoupon | null;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface OrderSummary {
  totalRevenue: number;
  statusCounts: Record<string, number>;
}

// ── Status Helpers ─────────────────────────────────────────

const STATUS_CONFIG: Record<
  string,
  { label: string; variant: BadgeVariant; icon: React.ElementType }
> = {
  PENDING: { label: 'รอดำเนินการ', variant: 'warning', icon: Clock },
  COMPLETED: { label: 'สำเร็จ', variant: 'success', icon: CheckCircle },
  FAILED: { label: 'ล้มเหลว', variant: 'destructive', icon: XCircle },
  REFUNDED: { label: 'คืนเงิน', variant: 'secondary', icon: RotateCcw },
};

function getStatusConfig(status: string) {
  return STATUS_CONFIG[status] || STATUS_CONFIG.PENDING;
}

// ── Utility ────────────────────────────────────────────────

function formatPrice(amount: number) {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
    minimumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ── Component ──────────────────────────────────────────────

export default function AdminOrdersPage() {
  const { toast } = useToast();

  const [payments, setPayments] = useState<Payment[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [summary, setSummary] = useState<OrderSummary | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState<string>('newest');
  const [page, setPage] = useState(1);
  const limit = 10;

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  const getToken = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('accessToken') || localStorage.getItem('token') || '';
    }
    return '';
  };

  // Fetch payments
  const fetchPayments = async () => {
    setLoading(true);
    try {
      const token = getToken();
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });
      if (debouncedSearch) params.append('search', debouncedSearch);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (sortBy) params.append('sort', sortBy);

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'}/payments/admin?${params}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        }
      );
      const data = await res.json();

      if (data.success) {
        setPayments(data.data.payments);
        setPagination(data.data.pagination);
        setSummary(data.data.summary);
      } else {
        toast.error(data.error || 'ไม่สามารถโหลดข้อมูลได้');
      }
    } catch (error) {
      console.error('Fetch payments error:', error);
      toast.error('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [page, debouncedSearch, statusFilter, sortBy]);

  // ── Stats Cards ────────────────────────────────────────

  const statsCards = useMemo(() => {
    if (!summary) return [];
    const sc = summary.statusCounts;
    const total = Object.values(sc).reduce((a, b) => a + b, 0);

    return [
      {
        label: 'คำสั่งซื้อทั้งหมด',
        value: total,
        icon: Receipt,
        color: 'text-blue-600',
        bg: 'bg-blue-50',
      },
      {
        label: 'รายได้รวม',
        value: formatPrice(summary.totalRevenue),
        icon: DollarSign,
        color: 'text-green-600',
        bg: 'bg-green-50',
      },
      {
        label: 'สำเร็จ',
        value: sc.COMPLETED || 0,
        icon: CheckCircle,
        color: 'text-emerald-600',
        bg: 'bg-emerald-50',
      },
      {
        label: 'รอดำเนินการ',
        value: sc.PENDING || 0,
        icon: Clock,
        color: 'text-amber-600',
        bg: 'bg-amber-50',
      },
    ];
  }, [summary]);

  // ── Render ────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">คำสั่งซื้อ</h1>
        <p className="text-sm text-gray-500 mt-1">จัดการและตรวจสอบรายการคำสั่งซื้อทั้งหมด</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((stat) => (
          <div
            key={stat.label}
            className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4"
          >
            <div className={`${stat.bg} ${stat.color} p-3 rounded-lg`}>
              <stat.icon size={20} />
            </div>
            <div>
              <p className="text-sm text-gray-500">{stat.label}</p>
              <p className="text-xl font-bold text-gray-900">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="ค้นหาด้วยชื่อผู้ใช้, อีเมล, คอร์ส หรือ Transaction ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-10 pl-9 pr-4 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>

          {/* Status Filter */}
          <Select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="w-full sm:w-44"
          >
            <option value="all">ทุกสถานะ</option>
            <option value="PENDING">รอดำเนินการ</option>
            <option value="COMPLETED">สำเร็จ</option>
            <option value="FAILED">ล้มเหลว</option>
            <option value="REFUNDED">คืนเงิน</option>
          </Select>

          {/* Sort */}
          <Select
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value);
              setPage(1);
            }}
            className="w-full sm:w-44"
          >
            <option value="newest">ล่าสุด</option>
            <option value="oldest">เก่าสุด</option>
            <option value="amount-desc">ราคามาก → น้อย</option>
            <option value="amount-asc">ราคาน้อย → มาก</option>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-gray-400">กำลังโหลดข้อมูล...</p>
            </div>
          </div>
        ) : payments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <Receipt size={48} className="mb-3 opacity-50" />
            <p className="text-sm">ไม่พบรายการคำสั่งซื้อ</p>
            {debouncedSearch && <p className="text-xs mt-1">ลองค้นหาด้วยคำอื่น</p>}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/80">
                <TableHead className="w-20">#</TableHead>
                <TableHead>ผู้ซื้อ</TableHead>
                <TableHead>คอร์ส</TableHead>
                <TableHead>จำนวนเงิน</TableHead>
                <TableHead>คูปอง</TableHead>
                <TableHead>สถานะ</TableHead>
                <TableHead>วันที่</TableHead>
                <TableHead className="w-20 text-center">ดู</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((payment, index) => {
                const config = getStatusConfig(payment.status);
                const StatusIcon = config.icon;
                const rowNumber = ((pagination?.page || 1) - 1) * limit + index + 1;

                return (
                  <TableRow key={payment.id}>
                    <TableCell className="font-mono text-xs text-gray-400">{rowNumber}</TableCell>

                    {/* User */}
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold shrink-0">
                          {payment.user.name?.[0]?.toUpperCase() || '?'}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 truncate text-sm">
                            {payment.user.name}
                          </p>
                          <p className="text-xs text-gray-400 truncate">{payment.user.email}</p>
                        </div>
                      </div>
                    </TableCell>

                    {/* Course */}
                    <TableCell>
                      <div className="max-w-50">
                        <p className="font-medium text-gray-800 truncate text-sm">
                          {payment.course.title}
                        </p>
                      </div>
                    </TableCell>

                    {/* Amount */}
                    <TableCell>
                      <span className="font-semibold text-gray-900">
                        {formatPrice(payment.amount)}
                      </span>
                    </TableCell>

                    {/* Coupon */}
                    <TableCell>
                      {payment.coupon ? (
                        <Badge variant="outline" className="font-mono text-xs">
                          {payment.coupon.code}
                        </Badge>
                      ) : (
                        <span className="text-xs text-gray-300">—</span>
                      )}
                    </TableCell>

                    {/* Status */}
                    <TableCell>
                      <Badge variant={config.variant}>
                        <StatusIcon size={12} className="mr-1" />
                        {config.label}
                      </Badge>
                    </TableCell>

                    {/* Date */}
                    <TableCell className="text-sm text-gray-500 whitespace-nowrap">
                      {formatDate(payment.createdAt)}
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="text-center">
                      {payment.stripeId && (
                        <a
                          href={`https://dashboard.stripe.com/payments/${payment.stripeId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-gray-400 hover:text-primary hover:bg-primary/5 transition-colors"
                          title="ดูใน Stripe Dashboard"
                        >
                          <ExternalLink size={16} />
                        </a>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              แสดง <span className="font-medium">{(pagination.page - 1) * limit + 1}</span> ถึง{' '}
              <span className="font-medium">
                {Math.min(pagination.page * limit, pagination.total)}
              </span>{' '}
              จาก <span className="font-medium">{pagination.total}</span> รายการ
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={!pagination.hasPrev}
                className="h-9 w-9 inline-flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={16} />
              </button>

              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                .filter((p) => {
                  return (
                    p === 1 || p === pagination.totalPages || Math.abs(p - pagination.page) <= 1
                  );
                })
                .reduce<(number | '...')[]>((acc, p, i, arr) => {
                  if (i > 0 && p - (arr[i - 1] as number) > 1) {
                    acc.push('...');
                  }
                  acc.push(p);
                  return acc;
                }, [])
                .map((p, i) =>
                  p === '...' ? (
                    <span key={`dots-${i}`} className="w-9 text-center text-gray-400 text-sm">
                      ...
                    </span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => setPage(p as number)}
                      className={`h-9 w-9 inline-flex items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                        p === pagination.page
                          ? 'bg-primary text-white'
                          : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {p}
                    </button>
                  )
                )}

              <button
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={!pagination.hasNext}
                className="h-9 w-9 inline-flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
