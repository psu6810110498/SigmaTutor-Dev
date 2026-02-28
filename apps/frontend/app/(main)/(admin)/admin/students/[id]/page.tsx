"use client";

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { 
    ArrowLeft, Edit, User, MapPin, GraduationCap, 
    Phone, Mail, Calendar, BookOpen
} from 'lucide-react';

export default function ViewStudentPage() {
    const params = useParams();
    const [student, setStudent] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const getToken = () => localStorage.getItem('accessToken') || localStorage.getItem('token') || '';

    useEffect(() => {
        const fetchStudentData = async () => {
            try {
                const token = getToken();
                const res = await fetch(`http://localhost:4000/api/users/${params.id}`, {
                    method: 'GET',
                    headers: { 'Authorization': `Bearer ${token}` },
                    credentials: 'include'
                });
                
                const data = await res.json();
                if (data.success && data.data) {
                    setStudent(data.data);
                }
            } catch (error) {
                console.error("ดึงข้อมูลไม่สำเร็จ:", error);
            } finally {
                setLoading(false);
            }
        };

        if (params.id) fetchStudentData();
    }, [params.id]);

    if (loading) return (
        <div className="flex h-[60vh] flex-col items-center justify-center space-y-4">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm font-medium text-slate-500">กำลังโหลดข้อมูลนักเรียน...</p>
        </div>
    );

    if (!student) return (
        <div className="flex h-[60vh] flex-col items-center justify-center space-y-4">
            <User size={48} className="text-slate-300" />
            <p className="text-lg font-bold text-slate-600">ไม่พบข้อมูลนักเรียน</p>
            <Link href="/admin/students" className="text-blue-600 hover:underline text-sm font-medium">
                กลับไปหน้ารวมนักเรียน
            </Link>
        </div>
    );

    return (
        <div className="p-4 md:p-8 max-w-5xl mx-auto animate-in fade-in duration-500">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-4">
                    <Link href="/admin/students" className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-500">
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-black text-slate-900">ข้อมูลนักเรียน</h1>
                        <p className="text-sm text-slate-500 mt-1">รายละเอียดโปรไฟล์และข้อมูลการติดต่อ</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Link 
                        href={`/admin/students/${student.id}/edit`} 
                        className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
                    >
                        <Edit size={16} /> แก้ไขข้อมูล
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* 🌟 คอลัมน์ซ้าย: รูปโปรไฟล์ & ข้อมูลหลัก */}
                <div className="md:col-span-1 space-y-6">
                    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center text-center">
                        <div className="relative w-32 h-32 rounded-full border-4 border-white shadow-lg overflow-hidden bg-slate-50 mb-4">
                            <img 
                                src={student.profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${student.id}`} 
                                className="w-full h-full object-cover" 
                                alt={student.name} 
                            />
                        </div>
                        <h2 className="text-xl font-black text-slate-900">{student.name}</h2>
                        <p className="text-sm font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full mt-2">
                            {student.nickname || 'ไม่ได้ระบุชื่อเล่น'}
                        </p>
                    </div>

                    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">ข้อมูลติดต่อ</h3>
                        
                        <div className="flex items-center gap-3 text-slate-700">
                            <div className="p-2 bg-slate-50 rounded-lg text-slate-400"><Mail size={16} /></div>
                            <div className="flex-1 overflow-hidden">
                                <p className="text-[10px] font-bold text-slate-400 uppercase">อีเมล</p>
                                <p className="text-sm font-medium truncate">{student.email}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 text-slate-700">
                            <div className="p-2 bg-slate-50 rounded-lg text-slate-400"><Phone size={16} /></div>
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase">เบอร์โทรศัพท์</p>
                                <p className="text-sm font-medium">{student.phone || '-'}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 🌟 คอลัมน์ขวา: ข้อมูลการศึกษา & ที่อยู่ */}
                <div className="md:col-span-2 space-y-6">
                    
                    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                        <div className="px-6 py-5 border-b border-slate-100 flex items-center gap-2 bg-slate-50/50">
                            <GraduationCap size={18} className="text-slate-500" />
                            <h2 className="text-sm font-black text-slate-800 uppercase tracking-wide">ข้อมูลการศึกษาและส่วนตัว</h2>
                        </div>
                        
                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8">
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase mb-1 flex items-center gap-1.5"><Calendar size={14}/> วันเกิด</p>
                                <p className="text-sm font-bold text-slate-800">
                                    {student.birthday 
                                        ? new Date(student.birthday).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })
                                        : '-'}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase mb-1 flex items-center gap-1.5"><BookOpen size={14}/> ระดับชั้น</p>
                                <p className="text-sm font-bold text-slate-800">{student.educationLevel || '-'}</p>
                            </div>
                            <div className="md:col-span-2">
                                <p className="text-xs font-bold text-slate-400 uppercase mb-1">โรงเรียน / สถาบัน</p>
                                <p className="text-sm font-bold text-slate-800">{student.school || '-'}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                        <div className="px-6 py-5 border-b border-slate-100 flex items-center gap-2 bg-slate-50/50">
                            <MapPin size={18} className="text-slate-500" />
                            <h2 className="text-sm font-black text-slate-800 uppercase tracking-wide">ที่อยู่จัดส่งเอกสาร</h2>
                        </div>
                        
                        <div className="p-6 space-y-4">
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase mb-1">จังหวัด</p>
                                <p className="text-sm font-bold text-slate-800">{student.province || '-'}</p>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase mb-1">ที่อยู่แบบเต็ม</p>
                                <p className="text-sm font-medium text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
                                    {student.address || 'ยังไม่มีข้อมูลที่อยู่'}
                                </p>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}