"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { 
    Users, BookOpen, Plus, Trash2, Search, Filter, 
    UserCheck, BarChart3, TrendingUp,
    Eye, Pencil, ChevronLeft, ChevronRight
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
        <div className="p-6 space-y-6 animate-in fade-in duration-500 min-h-screen bg-slate-50/30">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">จัดการคุณครู</h1>
                    <p className="text-sm text-slate-500 mt-1">ติดตามรายได้และประสิทธิภาพการสอนจากฐานข้อมูลจริง</p>
                </div>
                <Link href="/admin/teachers/create">
                    <button className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200">
                        <Plus size={18} /> เพิ่มคุณครูใหม่
                    </button>
                </Link>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {statsData.map((stat, i) => (
                    <div key={i} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow cursor-default group">
                        <div className={`p-3 rounded-2xl ${stat.bg} ${stat.color} group-hover:scale-110 transition-transform`}>
                            <stat.icon size={24} />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">{stat.label}</p>
                            <p className="text-xl font-black text-slate-900 mt-1">{stat.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Dropdown Bar Section (สไตล์หน้านักเรียน) */}
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-4 md:space-y-0 md:flex md:items-center md:gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                        type="text" 
                        placeholder="ค้นหาชื่อคุณครู หรือชื่อเล่น..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-blue-100 text-sm outline-none"
                    />
                </div>
                
                <div className="flex items-center gap-2">
                    <button className="p-2.5 text-slate-500 hover:bg-slate-50 rounded-xl transition-all border border-slate-100"><Filter size={18} /></button>
                    <button className="p-2.5 text-slate-500 hover:bg-slate-50 rounded-xl transition-all border border-slate-100"><BarChart3 size={18} /></button>
                </div>
            </div>

            {/* Table Section (สไตล์หน้านักเรียน) */}
            <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-xl shadow-slate-200/40">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50/50 border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">คุณครู / โปรไฟล์</th>
                                <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest text-right">รายได้สะสม (จริง)</th>
                                <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">คอร์สที่สอน</th>
                                <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">นักเรียนจริง</th>
                                <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest text-right">จัดการ</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? (
                                <tr><td colSpan={5} className="px-6 py-20 text-center text-slate-400 animate-pulse font-bold">กำลังซิงค์ข้อมูลสถิติจริง...</td></tr>
                            ) : filteredTeachers.length > 0 ? (
                                filteredTeachers.map((teacher) => {
                                    const courseCount = teacher._count?.courses || 0;
                                    const studentCount = teacher._count?.enrollments || 0;
                                    const earnings = Number(teacher.totalEarnings || 0); 
                                    
                                    return (
                                        <tr key={teacher.id} className="hover:bg-slate-50/30 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="relative">
                                                        <img 
                                                            src={teacher.profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${teacher.id}`} 
                                                            className="w-10 h-10 rounded-full object-cover bg-slate-800 text-white flex items-center justify-center font-bold text-sm shadow-inner ring-2 ring-white" 
                                                            alt=""
                                                        />
                                                        <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white shadow-sm bg-green-500"></div>
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <p className="font-bold text-slate-900 text-sm">{teacher.name}</p>
                                                            {teacher.nickname && (
                                                                <span className="text-[10px] bg-indigo-50 text-indigo-500 px-1.5 py-0.5 rounded font-bold uppercase tracking-tighter border border-indigo-100">
                                                                    {teacher.nickname}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <span className="text-[10px] font-black uppercase tracking-tighter text-slate-400">
                                                            {teacher.title || 'Sigma Instructor'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <p className="text-sm font-black text-slate-900">฿{earnings.toLocaleString()}</p>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="text-sm font-black text-slate-900">{courseCount}</span>
                                                <span className="text-[10px] font-bold text-slate-400 ml-1">คอร์ส</span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="text-sm font-black text-indigo-600">{studentCount}</span>
                                                <span className="text-[10px] font-bold text-slate-400 ml-1">คน</span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Link href={`/admin/teachers/${teacher.id}`}>
                                                        <button className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all" title="ดูรายละเอียด">
                                                            <Eye size={16}/>
                                                        </button>
                                                    </Link>
                                                    <Link href={`/admin/teachers/${teacher.id}/edit`}>
                                                        <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all" title="แก้ไข">
                                                            <Pencil size={16}/>
                                                        </button>
                                                    </Link>
                                                    <button 
                                                        onClick={() => setDeletingId(teacher.id)}
                                                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all" 
                                                        title="ลบ"
                                                    >
                                                        <Trash2 size={16}/>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr><td colSpan={5} className="px-6 py-20 text-center text-slate-400 italic font-bold">ไม่พบข้อมูลที่คุณค้นหาในฐานข้อมูลขณะนี้</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination (สไตล์หน้านักเรียน) */}
                <div className="px-6 py-4 bg-slate-50/30 border-t border-slate-100 flex items-center justify-between">
                    <p className="text-xs text-slate-500 font-bold">แสดงทั้งหมด {filteredTeachers.length} รายการ</p>
                    <div className="flex gap-2">
                        <button className="p-1.5 border border-slate-200 rounded-lg text-slate-400 hover:bg-white transition-all disabled:opacity-30"><ChevronLeft size={16}/></button>
                        <button className="px-3 py-1 bg-blue-600 text-white rounded-lg text-xs font-bold shadow-md shadow-blue-100">1</button>
                        <button className="p-1.5 border border-slate-200 rounded-lg text-slate-400 hover:bg-white transition-all disabled:opacity-30"><ChevronRight size={16}/></button>
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