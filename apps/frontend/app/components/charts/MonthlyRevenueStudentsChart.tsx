'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { AdminDashboardMonthlyMetricPoint } from '@/app/lib/types';

interface MonthlyRevenueStudentsChartProps {
  revenue: AdminDashboardMonthlyMetricPoint[];
  newStudents: AdminDashboardMonthlyMetricPoint[];
}

export function MonthlyRevenueStudentsChart({
  revenue,
  newStudents,
}: MonthlyRevenueStudentsChartProps) {
  if (!revenue?.length && !newStudents?.length) {
    return (
      <div className="flex items-center justify-center py-10 text-sm text-gray-400">
        ยังไม่มีข้อมูลรายเดือนสำหรับแสดงกราฟ
      </div>
    );
  }

  const map = new Map<string, { month: string; revenue?: number; newStudents?: number }>();

  for (const r of revenue || []) {
    map.set(r.month, {
      month: r.month,
      revenue: r.value,
      newStudents: map.get(r.month)?.newStudents,
    });
  }

  for (const s of newStudents || []) {
    const existing = map.get(s.month) || { month: s.month };
    existing.newStudents = s.value;
    map.set(s.month, existing);
  }

  const data = Array.from(map.values());

  return (
    <div className="w-full h-72">
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-gray-100" />
          <XAxis dataKey="month" tickLine={false} axisLine={false} className="text-xs" />
          <YAxis
            yAxisId="left"
            tickLine={false}
            axisLine={false}
            className="text-xs"
            tickFormatter={(v) => (v >= 1000 ? `${Math.round(v / 1000)}k` : String(v))}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            tickLine={false}
            axisLine={false}
            className="text-xs"
          />
          <Tooltip
            contentStyle={{
              borderRadius: 12,
              borderColor: '#e5e7eb',
              boxShadow: '0 10px 30px rgba(15,23,42,0.08)',
              fontSize: 12,
            }}
            formatter={(value: number, name: string) => {
              if (name === 'revenue') {
                return [
                  new Intl.NumberFormat('th-TH', {
                    style: 'currency',
                    currency: 'THB',
                    maximumFractionDigits: 0,
                  }).format(value),
                  'รายได้รวม',
                ];
              }
              if (name === 'newStudents') {
                return [`${value} คน`, 'นักเรียนใหม่'];
              }
              return [value, name];
            }}
          />
          <Legend formatter={(value) => (value === 'revenue' ? 'รายได้รวม' : 'นักเรียนใหม่')} />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="revenue"
            name="revenue"
            stroke="#2563eb"
            strokeWidth={2}
            dot={false}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="newStudents"
            name="newStudents"
            stroke="#22c55e"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
