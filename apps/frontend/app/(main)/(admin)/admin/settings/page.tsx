export default function AdminSettingsPage() {
    return (
        <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-6">ตั้งค่าระบบ</h1>

            <div className="bg-white rounded-xl border border-gray-200 p-6 max-w-2xl">
                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">ชื่อแพลตฟอร์ม</label>
                        <input type="text" className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" defaultValue="Sigma Tutor" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">อีเมลติดต่อ</label>
                        <input type="email" className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" defaultValue="contact@sigmatutor.com" />
                    </div>
                    <button className="px-6 py-2 bg-primary text-white font-medium rounded-lg hover:bg-primary-dark transition-colors">
                        บันทึกการเปลี่ยนแปลง
                    </button>
                </div>
            </div>
        </div>
    );
}
