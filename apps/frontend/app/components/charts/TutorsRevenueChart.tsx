'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { AdminDashboardTutorSummary } from '@/app/lib/types';

interface TutorsRevenueChartProps {
  data: AdminDashboardTutorSummary[];
}

export function TutorsRevenueChart({ data }: TutorsRevenueChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center py-10 text-sm text-gray-400">
        ยังไม่มีข้อมูลติวเตอร์สำหรับแสดงกราฟ
      </div>
    );
  }

  const formatted = data.map((t) => ({
    ...t,
    label: t.name.length > 18 ? t.name.slice(0, 18) + '…' : t.name,
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
            formatter={(value: number, name: string, props) => {
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
              if (name === 'studentCount') {
                return [`${value} คน`, 'จำนวนนักเรียน'];
              }
              if (name === 'courseCount') {
                return [`${value} คอร์ส`, 'จำนวนคอร์ส'];
              }
              if (name === 'avgRating') {
                return [`${value.toFixed(2)} / 5`, 'คะแนนเฉลี่ย'];
              }
              return [value, name];
            }}
            labelFormatter={(_label, payload) =>
              payload && payload[0]?.payload?.name ? payload[0].payload.name : ''
            }
          />
          <Bar dataKey="revenue" name="revenue" fill="#2563eb" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
