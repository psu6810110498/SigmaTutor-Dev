"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { 
    Users, BookOpen, Plus, Trash2, Edit, Search, Filter, 
    MoreVertical, Star, UserCheck, BarChart3, TrendingUp,
    Wallet
} from 'lucide-react';
import { useToast } from "@/app/components/ui/Toast";
import { ConfirmDialog } from "@/app/components/ui/ConfirmDialog";

export default function AdminTeachersPage() {
    const { toast } = useToast();
    const [teachers, setTeachers] = useState<any[]>([]);
    const [totalUniqueStudents, setTotalUniqueStudents] = useState(0);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    
    // State สำหรับเก็บ ID ของคุณครูที่กำลังจะลบ
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const getToken = () => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('accessToken') || localStorage.getItem('token') || '';
        }
        return '';
    };

    const fetchTeachers = async () => {
        setLoading(true);
        try {
            const token = getToken();
            const res = await fetch('http://localhost:4000/api/users/instructors', { 
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                credentials: 'include'
            });
            const data = await res.json();
            if (data.success) {
                setTeachers(data.data);
                setTotalUniqueStudents(data.totalUniqueStudents || 0);
            }
        } catch (error) {
            console.error("Fetch teachers error:", error);
            toast.error("ไม่สามารถดึงข้อมูลคุณครูได้");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTeachers();
    }, []);

    // ฟังก์ชันสำหรับลบคุณครูออกจากระบบ
    const handleDelete = async () => {
        if (!deletingId) return;
        try {
            const token = getToken();
            const response = await fetch(`http://localhost:4000/api/users/${deletingId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
            });
            const res = await response.json();

            if (res.success) {
                toast.success('ลบข้อมูลคุณครูเรียบร้อยแล้ว');
                setDeletingId(null);
                fetchTeachers(); // ดึงข้อมูลใหม่หลังจากลบสำเร็จ
            } else {
                toast.error(res.error || 'เกิดข้อผิดพลาดในการลบ');
            }
        } catch (error) {
            console.error('Delete Error:', error);
            toast.error('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้');
        }
    };

    // ── การคำนวณสถิติจริงจากข้อมูลที่ดึงมา ──────────────────────
    const statsData = useMemo(() => {
        const total = teachers.length;
        const courses = teachers.reduce((sum, t) => sum + (t._count?.courses || 0), 0);
        // แปลงเป็น Number อีกชั้นเพื่อความปลอดภัยในฝั่ง Frontend
        const totalSystemEarnings = teachers.reduce((sum, t) => sum + Number(t.totalEarnings || 0), 0);
        
        return [
          { label: 'คุณครูทั้งหมด', value: `${total} ท่าน`, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'คอร์สที่เปิดสอน', value: `${courses} คอร์ส`, icon: BookOpen, color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'นักเรียนรวม', value: `${totalUniqueStudents} คน`, icon: UserCheck, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'รายได้รวมระบบ', value: `฿${totalSystemEarnings.toLocaleString()}`, icon: TrendingUp, color: 'text-orange-500', bg: 'bg-orange-50' },
        ];
    }, [teachers, totalUniqueStudents]);

    const filteredTeachers = useMemo(() => {
        return teachers.filter(t => 
            t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (t.nickname && t.nickname.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    }, [teachers, searchTerm]);

    return (
        <div className="p-6 space-y-8 bg-gray-50/30 min-h-screen">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight">จัดการคุณครู</h1>
                    <p className="text-sm text-gray-500 font-medium tracking-tight">ติดตามรายได้และประสิทธิภาพการสอนจากฐานข้อมูลจริง</p>
                </div>
                <Link href="/admin/teachers/create">
                    <button className="flex items-center gap-2 px-6 py-3 bg-primary text-white text-sm font-bold rounded-2xl hover:bg-primary-dark transition-all shadow-lg shadow-primary/25 active:scale-95">
                        <Plus size={20} /> เพิ่มคุณครูใหม่
                    </button>
                </Link>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {statsData.map((stat, i) => (
                    <div key={i} className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow cursor-default group">
                        <div className={`p-3 rounded-2xl ${stat.bg} ${stat.color} group-hover:scale-110 transition-transform`}>
                            <stat.icon size={24} />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">{stat.label}</p>
                            <p className="text-xl font-black text-gray-900 mt-1">{stat.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Table Area */}
            <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-50 flex flex-col md:flex-row gap-4 justify-between items-center bg-white/50">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input 
                            type="text" 
                            placeholder="ค้นหาชื่อคุณครู..."
                            className="w-full pl-12 pr-4 py-3 bg-gray-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-primary/10 transition-all outline-none"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <button className="p-3 text-gray-500 hover:bg-gray-50 rounded-xl transition-all border border-gray-100"><Filter size={18} /></button>
                        <button className="p-3 text-gray-500 hover:bg-gray-50 rounded-xl transition-all border border-gray-100"><BarChart3 size={18} /></button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50">
                                <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest">คุณครู / โปรไฟล์</th>
                                <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest">รายได้สะสม (จริง)</th>
                                <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">คอร์สที่สอน</th>
                                <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">นักเรียนจริง</th>
                                <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest text-right">จัดการ</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                <tr><td colSpan={5} className="py-20 text-center text-gray-400 animate-pulse font-bold tracking-tight">กำลังซิงค์ข้อมูลสถิติจริง...</td></tr>
                            ) : filteredTeachers.length > 0 ? (
                                filteredTeachers.map((teacher) => {
                                    const courseCount = teacher._count?.courses || 0;
                                    const studentCount = teacher._count?.enrollments || 0;
                                    const earnings = Number(teacher.totalEarnings || 0); 
                                    
                                    return (
                                        <tr key={teacher.id} className="group hover:bg-gray-50/80 transition-all cursor-default">
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="relative">
                                                        <img 
                                                            src={teacher.profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${teacher.id}`} 
                                                            className="w-14 h-14 rounded-2xl object-cover ring-4 ring-white shadow-md group-hover:scale-105 transition-transform" 
                                                            alt=""
                                                        />
                                                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full shadow-sm"></div>
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <p className="text-sm font-black text-gray-900 leading-none">{teacher.name}</p>
                                                            {teacher.nickname && (
                                                                <span className="text-[10px] bg-indigo-50 text-indigo-500 px-1.5 py-0.5 rounded font-bold uppercase tracking-tighter border border-indigo-100">
                                                                    {teacher.nickname}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter mt-1">{teacher.title || 'Sigma Instructor'}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-2">
                                                    <div className="p-2 bg-green-50 text-green-600 rounded-lg"><Wallet size={16}/></div>
                                                    <span className="text-base font-black text-slate-900">฿{earnings.toLocaleString()}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-center">
                                                <div className="inline-flex flex-col items-center">
                                                    <span className="text-base font-black text-slate-900 leading-none">{courseCount}</span>
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase mt-1">คอร์ส</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-center">
                                                <div className="inline-flex flex-col items-center">
                                                    <span className="text-base font-black text-indigo-600 leading-none">{studentCount}</span>
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase mt-1">นักเรียน</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Link href={`/admin/teachers/${teacher.id}/edit`}>
                                                        <button className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all shadow-sm border border-transparent hover:border-blue-100 active:scale-95" title="แก้ไขข้อมูล">
                                                            <Edit size={18} />
                                                        </button>
                                                    </Link>
                                                    <button 
                                                        onClick={() => setDeletingId(teacher.id)}
                                                        className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all shadow-sm border border-transparent hover:border-red-100 active:scale-95" title="ลบคุณครู"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                    <Link href={`/admin/teachers/${teacher.id}`}>
                                                        <button className="p-2.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all active:scale-95" title="ดูรายละเอียดเพิ่มเติม">
                                                            <MoreVertical size={18} />
                                                        </button>
                                                    </Link>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr><td colSpan={5} className="px-8 py-20 text-center text-gray-400 text-sm font-bold tracking-tight">ไม่พบข้อมูลที่คุณค้นหาในฐานข้อมูลขณะนี้</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="p-6 bg-gray-50/50 border-t border-gray-100 flex justify-between items-center text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    <p>Total Sync: {teachers.length} Active Instructors Found</p>
                    <div className="flex gap-2 font-black uppercase">
                        <button className="px-5 py-2 bg-white border border-gray-200 rounded-xl opacity-50 cursor-not-allowed shadow-sm">Previous</button>
                        <button className="px-5 py-2 bg-white border border-gray-200 rounded-xl opacity-50 cursor-not-allowed shadow-sm">Next</button>
                    </div>
                </div>
            </div>

            <ConfirmDialog
                open={!!deletingId}
                onCancel={() => setDeletingId(null)}
                onConfirm={handleDelete}
                title="ลบข้อมูลคุณครู"
                message="คุณแน่ใจหรือไม่ที่จะลบข้อมูลคุณครูท่านนี้? คอร์สเรียนที่เชื่อมโยงกับคุณครูท่านนี้อาจได้รับผลกระทบ การกระทำนี้ไม่สามารถย้อนกลับได้"
                variant="danger"
            />
        </div>
    );
}