'use client';

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { AdminDashboardPaymentStatusPoint } from '@/app/lib/types';

interface PaymentStatusDonutChartProps {
  data: AdminDashboardPaymentStatusPoint[];
}

const COLORS = ['#22c55e', '#f97316', '#ef4444', '#6b7280'];

const STATUS_LABEL: Record<string, string> = {
  COMPLETED: 'สำเร็จ',
  PENDING: 'รอดำเนินการ',
  FAILED: 'ไม่สำเร็จ',
  REFUNDED: 'คืนเงิน',
};

export function PaymentStatusDonutChart({ data }: PaymentStatusDonutChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center py-10 text-sm text-gray-400">
        ยังไม่มีข้อมูลการชำระเงิน
      </div>
    );
  }

  const total = data.reduce((sum, item) => sum + item.count, 0);

  const formatted = data.map((item) => ({
    ...item,
    label: STATUS_LABEL[item.status] || item.status,
    percent: total > 0 ? Math.round((item.count / total) * 100) : 0,
  }));

  return (
    <div className="w-full h-72 flex items-center justify-center">
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={formatted}
            innerRadius={60}
            outerRadius={90}
            paddingAngle={4}
            dataKey="count"
            nameKey="label"
          >
            {formatted.map((entry, index) => (
              <Cell key={entry.status} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number, _name, props) => {
              const percent = (props.payload as any)?.percent ?? 0;
              return [`${value} รายการ (${percent}%)`, ''];
            }}
          />
          <Legend formatter={(value: string) => value} wrapperStyle={{ fontSize: 12 }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
