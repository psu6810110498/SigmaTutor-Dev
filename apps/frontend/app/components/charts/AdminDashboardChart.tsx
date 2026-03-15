'use client';

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';
import { AdminDashboardDailyPoint } from '@/app/lib/types';

interface AdminDashboardChartProps {
  data: AdminDashboardDailyPoint[];
}

export function AdminDashboardChart({ data }: AdminDashboardChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center py-10 text-sm text-gray-400">
        ยังไม่มีข้อมูลสำหรับแสดงกราฟ
      </div>
    );
  }

  const formatted = data.map((d) => ({
    ...d,
    label: new Date(d.date).toLocaleDateString('th-TH', {
      day: '2-digit',
      month: 'short',
    }),
  }));

  return (
    <div className="w-full h-72">
      <ResponsiveContainer>
        <AreaChart data={formatted} margin={{ left: 0, right: 0, top: 10, bottom: 0 }}>
          <defs>
            <linearGradient id="revenue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#2563eb" stopOpacity={0.9} />
              <stop offset="95%" stopColor="#2563eb" stopOpacity={0.05} />
            </linearGradient>
            <linearGradient id="enrollments" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#16a34a" stopOpacity={0.7} />
              <stop offset="95%" stopColor="#16a34a" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" className="stroke-gray-100" />
          <XAxis dataKey="label" tickLine={false} axisLine={false} className="text-xs" />
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
            formatter={(value: number, name: string) => {
              if (name === 'revenue') {
                return [
                  new Intl.NumberFormat('th-TH', {
                    style: 'currency',
                    currency: 'THB',
                    maximumFractionDigits: 0,
                  }).format(value),
                  'รายได้',
                ];
              }
              return [value, 'ลงทะเบียน'];
            }}
            labelFormatter={(label) => `วันที่ ${label}`}
          />
          <Legend formatter={(value) => (value === 'revenue' ? 'รายได้' : 'จำนวนลงทะเบียน')} />
          <Area
            type="monotone"
            dataKey="revenue"
            name="revenue"
            stroke="#2563eb"
            strokeWidth={2}
            fill="url(#revenue)"
          />
          <Area
            type="monotone"
            dataKey="enrollments"
            name="enrollments"
            stroke="#16a34a"
            strokeWidth={2}
            fill="url(#enrollments)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
