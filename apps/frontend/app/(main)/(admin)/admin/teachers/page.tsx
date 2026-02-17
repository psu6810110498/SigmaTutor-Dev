export default function AdminTeachersPage() {
    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-gray-900">จัดการคุณครู</h1>
                <button className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-dark transition-colors">
                    + เพิ่มคุณครู
                </button>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <p className="text-gray-400 text-sm text-center py-12">
                    รายชื่อคุณครูและสถานะการอนุมัติจะแสดงที่นี่
                </p>
            </div>
        </div>
    );
}
