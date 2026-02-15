import { BookOpen, Users, CreditCard, TrendingUp } from "lucide-react";

export default function AdminDashboardPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "คอร์สทั้งหมด", value: "—", icon: BookOpen, color: "text-blue-600 bg-blue-50" },
          { label: "นักเรียน", value: "—", icon: Users, color: "text-green-600 bg-green-50" },
          { label: "รายได้", value: "—", icon: CreditCard, color: "text-purple-600 bg-purple-50" },
          { label: "ยอดเข้าชม", value: "—", icon: TrendingUp, color: "text-orange-600 bg-orange-50" },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-500">{stat.label}</span>
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${stat.color}`}>
                <stat.icon size={18} />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <p className="text-gray-400 text-sm text-center py-12">
          รอเชื่อมต่อ Backend — ข้อมูลจะแสดงที่นี่
        </p>
      </div>
    </div>
  );
}
