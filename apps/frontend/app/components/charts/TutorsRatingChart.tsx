'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { AdminDashboardTutorSummary } from '@/app/lib/types';

interface TutorsRatingChartProps {
  data: AdminDashboardTutorSummary[];
}

export function TutorsRatingChart({ data }: TutorsRatingChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center py-10 text-sm text-gray-400">
        ยังไม่มีข้อมูลคะแนนติวเตอร์
      </div>
    );
  }

  const formatted = data
    .filter((t) => t.avgRating > 0)
    .map((t) => ({
      ...t,
      label: t.name.length > 18 ? t.name.slice(0, 18) + '…' : t.name,
    }));

  if (formatted.length === 0) {
    return (
      <div className="flex items-center justify-center py-10 text-sm text-gray-400">
        ยังไม่มีคะแนนรีวิวสำหรับติวเตอร์
      </div>
    );
  }

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
          <YAxis domain={[0, 5]} tickLine={false} axisLine={false} className="text-xs" />
          <Tooltip
            contentStyle={{
              borderRadius: 12,
              borderColor: '#e5e7eb',
              boxShadow: '0 10px 30px rgba(15,23,42,0.08)',
              fontSize: 12,
            }}
            formatter={(value: number) => [`${value.toFixed(2)} / 5`, 'คะแนนเฉลี่ย']}
            labelFormatter={(_label, payload) =>
              payload && payload[0]?.payload?.name ? payload[0].payload.name : ''
            }
          />
          <Bar dataKey="avgRating" fill="#3b82f6" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
