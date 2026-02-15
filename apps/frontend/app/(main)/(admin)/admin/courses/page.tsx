export default function AdminCoursesPage() {
    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-gray-900">จัดการคอร์ส</h1>
                <button className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-dark transition-colors">
                    + เพิ่มคอร์สใหม่
                </button>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <p className="text-gray-400 text-sm text-center py-12">
                    รอเชื่อมต่อ Backend — รายการคอร์สจะแสดงที่นี่
                </p>
            </div>
        </div>
    );
}
