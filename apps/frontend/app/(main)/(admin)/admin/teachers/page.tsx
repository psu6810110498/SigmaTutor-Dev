"use client";

import React, { useState, useEffect } from 'react';

export default function AdminTeachersPage() {
    const [teachers, setTeachers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    
    // State สำหรับควบคุมหน้าต่าง Modal เพิ่มครู
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    const [formData, setFormData] = useState({ 
        name: '', email: '', password: '', 
        nickname: '', title: '', bio: '', profileImage: '' 
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    // ฟังก์ชันดึง Token (เผื่อระบบต้องการผ่าน Header)
    const getToken = () => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('accessToken') || localStorage.getItem('token') || '';
        }
        return '';
    };

    const fetchTeachers = async () => {
        try {
            const token = getToken();
            const res = await fetch('http://localhost:4000/api/users/instructors', { 
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                credentials: 'include' // ✅ สำคัญมาก: บังคับเบราว์เซอร์ส่ง Cookie เสมอ
            });
            const data = await res.json();
            if (data.success) {
                setTeachers(data.data);
            } else if (data.error === 'No token provided' || data.error === 'jwt expired') {
                console.warn('Token หมดอายุ กรุณาล็อกอินใหม่');
            }
        } catch (error) {
            console.error("Fetch teachers error:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTeachers();
    }, []);

    const handleCreateTeacher = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const token = getToken();
            const res = await fetch('http://localhost:4000/api/users/instructors', {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${token}`, 
                    'Content-Type': 'application/json'
                },
                credentials: 'include', // ✅ สำคัญมาก: ส่ง Cookie ไปยืนยันตัวตนตอนสร้างข้อมูล
                body: JSON.stringify(formData)
            });
            const data = await res.json();
            
            if (data.success) {
                alert('เพิ่มข้อมูลคุณครูสำเร็จแล้ว!');
                setIsModalOpen(false);
                setFormData({ name: '', email: '', password: '', nickname: '', title: '', bio: '', profileImage: '' });
                fetchTeachers(); 
            } else {
                alert(data.error || 'เกิดข้อผิดพลาดในการสร้างคุณครู');
            }
        } catch (error) {
            console.error("Create teacher error:", error);
            alert('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-gray-900">จัดการคุณครู</h1>
                <button 
                    onClick={() => setIsModalOpen(true)}
                    className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-dark transition-colors"
                >
                    + เพิ่มคุณครู
                </button>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                {loading ? (
                    <p className="text-gray-400 text-sm text-center py-12">กำลังโหลดข้อมูล...</p>
                ) : teachers.length === 0 ? (
                    <p className="text-gray-400 text-sm text-center py-12">
                        รายชื่อคุณครูและสถานะการอนุมัติจะแสดงที่นี่
                    </p>
                ) : (
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-4 text-sm font-semibold text-gray-600">โปรไฟล์</th>
                                <th className="px-6 py-4 text-sm font-semibold text-gray-600">ชื่อ-นามสกุล / ตำแหน่ง</th>
                                <th className="px-6 py-4 text-sm font-semibold text-gray-600">อีเมล</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {teachers.map((teacher) => (
                                <tr key={teacher.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4">
                                        <img 
                                            src={teacher.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(teacher.name)}&background=random`} 
                                            alt={teacher.name} 
                                            className="w-12 h-12 rounded-full object-cover border border-gray-200" 
                                        />
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="text-sm text-gray-900 font-bold">{teacher.name} {teacher.nickname && `(${teacher.nickname})`}</p>
                                        <p className="text-xs text-gray-500 mt-1">{teacher.title || 'ไม่มีตำแหน่งระบุ'}</p>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">{teacher.email}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* --- Modal สร้างครูใหม่ --- */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
                    <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden my-8 relative">
                        
                        <div className="flex justify-between items-center p-6 border-b border-gray-100">
                            <h2 className="text-xl font-bold text-gray-900">เพิ่มคุณครูใหม่</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-red-500 text-xl leading-none">
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleCreateTeacher} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">รูปภาพโปรไฟล์ (URL)</label>
                                <input 
                                    type="text" 
                                    value={formData.profileImage} onChange={e => setFormData({...formData, profileImage: e.target.value})}
                                    placeholder="วางลิงก์รูปถ่ายใบหน้าชัดเจน (ถ้ามี)"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none text-sm" 
                                />
                                {formData.profileImage && (
                                    <div className="mt-3 flex justify-center">
                                        <img src={formData.profileImage} alt="Preview" className="w-20 h-20 rounded-full object-cover border-2 border-gray-200" />
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อ-นามสกุล <span className="text-red-500">*</span></label>
                                    <input 
                                        type="text" required 
                                        value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                                        placeholder="เช่น สมชาย ใจดี"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none text-sm" 
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อเล่น</label>
                                    <input 
                                        type="text" 
                                        value={formData.nickname} onChange={e => setFormData({...formData, nickname: e.target.value})}
                                        placeholder="เช่น พี่บอส"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none text-sm" 
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">ตำแหน่ง / คำนำหน้า</label>
                                <input 
                                    type="text" 
                                    value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})}
                                    placeholder="เช่น ติวเตอร์คณิตศาสตร์อันดับ 1"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none text-sm" 
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">ประวัติย่อ (Bio)</label>
                                <textarea 
                                    rows={3}
                                    value={formData.bio} onChange={e => setFormData({...formData, bio: e.target.value})}
                                    placeholder="แนะนำตัวสั้นๆ ประสบการณ์ หรือสไตล์การสอน"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none text-sm resize-none" 
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">อีเมลสำหรับล็อกอิน <span className="text-red-500">*</span></label>
                                <input 
                                    type="email" required 
                                    value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
                                    placeholder="teacher@sigma.com"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none text-sm" 
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">ตั้งรหัสผ่าน <span className="text-red-500">*</span></label>
                                <input 
                                    type="password" required minLength={8}
                                    value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})}
                                    placeholder="กำหนดรหัสผ่านอย่างน้อย 8 ตัวอักษร"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none text-sm" 
                                />
                            </div>

                            <div className="pt-4 flex gap-3 border-t border-gray-100">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-bold transition-colors text-sm">
                                    ยกเลิก
                                </button>
                                <button type="submit" disabled={isSubmitting} className="flex-1 px-4 py-2.5 text-white bg-primary hover:bg-primary-dark rounded-lg font-bold transition-colors disabled:opacity-50 text-sm">
                                    {isSubmitting ? 'กำลังบันทึก...' : 'บันทึกคุณครูใหม่'}
                                </button>
                            </div>
                        </form>

                    </div>
                </div>
            )}
        </div>
    );
}