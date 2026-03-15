'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { AdminDashboardTopRatedCourse } from '@/app/lib/types';

interface TopRatedCoursesChartProps {
  data: AdminDashboardTopRatedCourse[];
}

export function TopRatedCoursesChart({ data }: TopRatedCoursesChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center py-10 text-sm text-gray-400">
        ยังไม่มีข้อมูลคอร์สที่มีรีวิวเพียงพอ
      </div>
    );
  }

  const formatted = data.map((c) => ({
    ...c,
    label: c.courseTitle.length > 18 ? c.courseTitle.slice(0, 18) + '…' : c.courseTitle,
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
          <YAxis domain={[0, 5]} tickLine={false} axisLine={false} className="text-xs" />
          <Tooltip
            contentStyle={{
              borderRadius: 12,
              borderColor: '#e5e7eb',
              boxShadow: '0 10px 30px rgba(15,23,42,0.08)',
              fontSize: 12,
            }}
            formatter={(value: number, _name, props) => {
              const count = (props.payload as any)?.reviewCount ?? 0;
              return [`${value.toFixed(2)} / 5 (${count} รีวิว)`, 'คะแนนเฉลี่ย'];
            }}
            labelFormatter={(label, payload) =>
              payload && payload[0]?.payload?.courseTitle
                ? payload[0].payload.courseTitle
                : String(label)
            }
          />
          <Bar dataKey="avgRating" fill="#22c55e" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
