'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useMemo, useState } from 'react';
import { BookOpen, Users, CreditCard, TrendingUp, FilterX } from 'lucide-react';
import { dashboardApi, courseApi, tutorApi } from '@/app/lib/api';
import { AdminDashboardStats, AdminDashboardFilters } from '@/app/lib/types';
import { SectionCard } from '@/app/components/ui/SectionCard';
import { Select } from '@/app/components/ui/select';
import { Input } from '@/app/components/ui/Input';
import { Button } from '@/app/components/ui/Button';
import { AdminDashboardChart } from '@/app/components/charts/AdminDashboardChart';
import { TopCoursesRevenueChart } from '@/app/components/charts/TopCoursesRevenueChart';
import { PaymentStatusDonutChart } from '@/app/components/charts/PaymentStatusDonutChart';
import { TutorsRevenueChart } from '@/app/components/charts/TutorsRevenueChart';
import { MonthlyRevenueStudentsChart } from '@/app/components/charts/MonthlyRevenueStudentsChart';
import { MonthlyNewCoursesChart } from '@/app/components/charts/MonthlyNewCoursesChart';
import { RatingDistributionChart } from '@/app/components/charts/RatingDistributionChart';
import { TopRatedCoursesChart } from '@/app/components/charts/TopRatedCoursesChart';
import { TutorsRatingChart } from '@/app/components/charts/TutorsRatingChart';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState<AdminDashboardFilters>({});
  const [courses, setCourses] = useState<any[]>([]);
  const [tutors, setTutors] = useState<any[]>([]);

  useEffect(() => {
    courseApi.getAdmin({ limit: 1000 }).then((res) => {
      if (res.success && res.data) {
        setCourses(Array.isArray(res.data) ? res.data : res.data.courses || []);
      }
    });
    tutorApi.getFiltered().then((res) => {
      if (res.success && res.data) {
        setTutors(res.data);
      }
    });
  }, []);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      const res = await dashboardApi.getAdminStats(filters);
      if (cancelled) return;

      if (res.success && res.data) {
        setStats(res.data);
      } else {
        setError(res.error || 'ไม่สามารถดึงข้อมูลแดชบอร์ดได้');
      }
      setLoading(false);
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [filters]);

  const handleFilterChange = (key: keyof AdminDashboardFilters, value: string) => {
    setFilters((prev) => {
      const newFilters = { ...prev, [key]: value || undefined };
      // Remove undefined keys so Object.keys(filters).length works correctly for the clear button
      if (!value) delete newFilters[key];
      return newFilters;
    });
  };

  const clearFilters = () => {
    setFilters({});
  };

  const cards = useMemo(() => {
    const totals = stats?.totals;

    return [
      {
        label: 'คอร์สทั้งหมด',
        value: totals ? totals.courses.toLocaleString('th-TH') : '—',
        icon: BookOpen,
        color: 'text-blue-600 bg-blue-50',
      },
      {
        label: 'นักเรียน',
        value: totals ? totals.students.toLocaleString('th-TH') : '—',
        icon: Users,
        color: 'text-green-600 bg-green-50',
      },
      {
        label: 'รายได้ (รวม)',
        value: totals
          ? new Intl.NumberFormat('th-TH', {
              style: 'currency',
              currency: 'THB',
              maximumFractionDigits: 0,
            }).format(totals.revenue)
          : '—',
        icon: CreditCard,
        color: 'text-purple-600 bg-purple-50',
      },
      {
        label: 'ยอดลงทะเบียนทั้งหมด',
        value: totals ? totals.enrollments.toLocaleString('th-TH') : '—',
        icon: TrendingUp,
        color: 'text-orange-600 bg-orange-50',
      },
    ];
  }, [stats]);

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">แดชบอร์ดผู้ดูแลระบบ</h1>
          <p className="text-gray-500 text-sm mt-1">สรุปภาพรวมระบบคอร์สเรียน นักเรียน และรายได้</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-gray-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Input
          type="date"
          label="วันที่เริ่มต้น"
          value={filters.startDate || ''}
          onChange={(e) => handleFilterChange('startDate', e.target.value)}
        />
        <Input
          type="date"
          label="วันที่สิ้นสุด"
          value={filters.endDate || ''}
          onChange={(e) => handleFilterChange('endDate', e.target.value)}
        />
        <Select
          label="คอร์สเรียน"
          value={filters.courseId || ''}
          onChange={(e) => handleFilterChange('courseId', e.target.value)}
        >
          <option value="">ทั้งหมด</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.title}
            </option>
          ))}
        </Select>
        <Select
          label="ติวเตอร์"
          value={filters.tutorId || ''}
          onChange={(e) => handleFilterChange('tutorId', e.target.value)}
        >
          <option value="">ทั้งหมด</option>
          {tutors.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </Select>
        <div className="flex items-end">
          <Button
            variant="outline"
            className="w-full h-[42px] px-0"
            onClick={clearFilters}
            disabled={Object.keys(filters).length === 0}
            icon={<FilterX size={16} />}
          >
            ล้างตัวกรอง
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((stat) => (
          <div
            key={stat.label}
            className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col gap-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">{stat.label}</span>
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${stat.color}`}>
                <stat.icon size={18} />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900 min-h-8">
              {loading && !stats ? '…' : stat.value}
            </p>
          </div>
        ))}
      </div>

      <SectionCard title="รายได้ & การลงทะเบียน 7 วันที่ผ่านมา">
        {error && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-100 px-4 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading && !stats ? (
          <div className="flex items-center justify-center py-10 text-sm text-gray-400">
            กำลังโหลดข้อมูลกราฟ...
          </div>
        ) : (
          <AdminDashboardChart data={stats?.daily || []} />
        )}
      </SectionCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SectionCard title="Top 5 คอร์สตามรายได้">
          <TopCoursesRevenueChart data={stats?.topCoursesByRevenue || []} />
        </SectionCard>

        <SectionCard title="สถานะการชำระเงิน">
          <PaymentStatusDonutChart data={stats?.paymentStatus || []} />
        </SectionCard>
      </div>

      <SectionCard title="ภาพรวมติวเตอร์ทั้งหมด (ตามรายได้)">
        <TutorsRevenueChart data={stats?.tutors || []} />
      </SectionCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SectionCard title="เทรนด์รายได้ & นักเรียนใหม่ (12 เดือน)">
          <MonthlyRevenueStudentsChart
            revenue={stats?.monthlyRevenue || []}
            newStudents={stats?.monthlyNewStudents || []}
          />
        </SectionCard>

        <SectionCard title="คอร์สใหม่รายเดือน (12 เดือน)">
          <MonthlyNewCoursesChart data={stats?.monthlyNewCourses || []} />
        </SectionCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SectionCard title="การกระจายคะแนนรีวิว (1–5 ดาว)">
          <RatingDistributionChart data={stats?.ratingDistribution || []} />
        </SectionCard>

        <SectionCard title="Top 5 คอร์สคะแนนสูงสุด">
          <TopRatedCoursesChart data={stats?.topRatedCourses || []} />
        </SectionCard>
      </div>

      <SectionCard title="คะแนนเฉลี่ยต่อติวเตอร์">
        <TutorsRatingChart data={stats?.tutors || []} />
      </SectionCard>
    </div>
  );
}
