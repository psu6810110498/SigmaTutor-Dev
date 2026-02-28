"use client";

import { useAuth } from "@/app/context/AuthContext";

export default function AdminSettingsPage() {
    const { user } = useAuth(); // ดึงข้อมูลแอดมินมาแสดงแบบ Real-time

    return (
        <div className="space-y-8 max-w-2xl">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">ตั้งค่าบัญชี & ระบบ</h1>
                <p className="text-sm text-gray-500 mt-1">จัดการข้อมูลส่วนตัวผู้ดูแลระบบและการตั้งค่าแพลตฟอร์ม</p>
            </div>

            {/* 🌟 ส่วนที่ 1: ข้อมูลส่วนตัวแอดมิน (แยกขาดจากนักเรียน) */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2 border-gray-100">ข้อมูลส่วนตัว (Admin Profile)</h2>
                <div className="space-y-6">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold text-2xl">
                            {user?.name?.charAt(0).toUpperCase() || 'A'}
                        </div>
                        <div>
                            <p className="font-bold text-gray-900">{user?.name || 'System Admin'}</p>
                            <p className="text-sm text-gray-500">{user?.email}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">ชื่อ-นามสกุล</label>
                            <input type="text" className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" defaultValue={user?.name || "System Admin"} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">อีเมล (ใช้ล็อกอิน)</label>
                            <input type="email" disabled className="w-full px-4 py-2 rounded-lg border border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed outline-none" defaultValue={user?.email || "admin@sigma.com"} />
                        </div>
                    </div>
                    <button className="px-6 py-2 bg-slate-900 text-white font-medium rounded-lg hover:bg-black transition-colors">
                        อัปเดตโปรไฟล์
                    </button>
                </div>
            </div>

            {/* 🌟 ส่วนที่ 2: ตั้งค่าระบบ (โค้ดเดิมของคุณ 100%) */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2 border-gray-100">ตั้งค่าแพลตฟอร์ม (System Settings)</h2>
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