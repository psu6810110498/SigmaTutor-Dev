'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { AdminDashboardTopCourse } from '@/app/lib/types';

interface TopCoursesRevenueChartProps {
  data: AdminDashboardTopCourse[];
}

export function TopCoursesRevenueChart({ data }: TopCoursesRevenueChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center py-10 text-sm text-gray-400">
        ยังไม่มีข้อมูลรายได้ต่อคอร์ส
      </div>
    );
  }

  const formatted = data.map((item) => ({
    ...item,
    label: item.courseTitle.length > 18 ? item.courseTitle.slice(0, 18) + '…' : item.courseTitle,
  }));

  return (
    <div className="w-full h-72">
      <ResponsiveContainer>
        <BarChart data={formatted} margin={{ top: 10, right: 10, left: 0, bottom: 40 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-gray-100" />
          <XAxis
            dataKey="label"
            interval={0}
            tickLine={false}
            axisLine={false}
            className="text-xs"
            angle={-20}
            textAnchor="end"
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            className="text-xs"
            tickFormatter={(v) => (v >= 1000 ? `${Math.round(v / 1000)}k` : String(v))}
          />
          <Tooltip
            contentStyle={{
              borderRadius: 12,
              borderColor: '#e5e7eb',
              boxShadow: '0 10px 30px rgba(15,23,42,0.08)',
              fontSize: 12,
            }}
            formatter={(value: number) =>
              new Intl.NumberFormat('th-TH', {
                style: 'currency',
                currency: 'THB',
                maximumFractionDigits: 0,
              }).format(value)
            }
            labelFormatter={(label, payload) =>
              payload && payload[0]?.payload?.courseTitle
                ? payload[0].payload.courseTitle
                : String(label)
            }
          />
          <Bar dataKey="revenue" fill="#6366f1" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
