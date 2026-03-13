'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { AdminDashboardMonthlyMetricPoint } from '@/app/lib/types';

interface MonthlyNewCoursesChartProps {
  data: AdminDashboardMonthlyMetricPoint[];
}

export function MonthlyNewCoursesChart({ data }: MonthlyNewCoursesChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center py-10 text-sm text-gray-400">
        ยังไม่มีข้อมูลคอร์สใหม่รายเดือน
      </div>
    );
  }

  return (
    <div className="w-full h-72">
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-gray-100" />
          <XAxis dataKey="month" tickLine={false} axisLine={false} className="text-xs" />
          <YAxis tickLine={false} axisLine={false} className="text-xs" />
          <Tooltip
            contentStyle={{
              borderRadius: 12,
              borderColor: '#e5e7eb',
              boxShadow: '0 10px 30px rgba(15,23,42,0.08)',
              fontSize: 12,
            }}
            formatter={(value: number) => [`${value} คอร์ส`, 'คอร์สใหม่']}
          />
          <Bar dataKey="value" fill="#f97316" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
