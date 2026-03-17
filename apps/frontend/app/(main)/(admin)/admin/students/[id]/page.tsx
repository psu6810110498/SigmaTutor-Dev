"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    ArrowLeft, Edit, User, MapPin, GraduationCap,
    Phone, Mail, Calendar, BookOpen, BookText, CreditCard
} from 'lucide-react';
import { useToast } from "@/app/components/ui/Toast";

export default function AdminStudentViewPage() {
    const params = useParams();
    const router = useRouter();
    const { toast } = useToast();

    const [student, setStudent] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const id = params.id as string;

    useEffect(() => {
        const fetchStudent = async () => {
            try {
                const res = await fetch((process.env.NEXT_PUBLIC_API_URL || `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'}`) + `/users/students`, {
                    credentials: 'include'
                });
                const data = await res.json();

                if (data.success) {
                    const found = data.data.find((s: any) => s.id === id);
                    if (found) {
                        setStudent(found);
                    } else {
                        toast.error("ไม่พบข้อมูลนักเรียน");
                        router.push('/admin/students');
                    }
                } else {
                    toast.error("ไม่สามารถโหลดข้อมูลนักเรียนได้");
                    router.push('/admin/students');
                }
            } catch (error) {
                console.error(error);
                toast.error("เกิดข้อผิดพลาดในการโหลดข้อมูล");
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchStudent();
    }, [id, router, toast]);

    if (loading) {
        return <div className="p-8 text-center text-gray-500 animate-pulse font-medium">กำลังโหลดข้อมูล...</div>;
    }

    if (!student) return null;

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
                                src={student.profileImage || `https://api.dicebear.com/9.x/avataaars/svg?seed=${student.id}`}
                                className="w-full h-full object-cover"
                                alt={student.name}
                            />
                        </div>
                        <h2 className="text-xl font-black text-slate-900">{student.name}</h2>
                        <div className="flex flex-col items-center gap-2 mt-2">
                            <p className="text-sm font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                                {student.nickname || 'ไม่ได้ระบุชื่อเล่น'}
                            </p>
                            <span className={`text-[10px] font-black uppercase tracking-tighter px-2 py-1 rounded
                                ${student.status === 'Online' ? 'bg-green-50 text-green-600 border border-green-200' : 'bg-slate-50 text-slate-500 border border-slate-200'}`}>
                                {student.status || 'Offline'}
                            </span>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">ข้อมูลติดต่อ</h3>
                        <div className="space-y-3">
                            <div className="flex items-center gap-3 text-slate-700">
                                <div className="p-2 bg-slate-50 rounded-lg text-slate-400"><Mail size={16} /></div>
                                <div className="flex-1 overflow-hidden">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase">อีเมล</p>
                                    <p className="text-sm font-medium truncate">{student.email}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 text-slate-700">
                                <div className="p-2 bg-slate-50 rounded-lg text-slate-400"><Calendar size={16} /></div>
                                <div className="flex-1 overflow-hidden">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase">วันที่สมัคร</p>
                                    <p className="text-sm font-medium">{new Date(student.createdAt).toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                                </div>
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
                                <p className="text-xs font-bold text-slate-400 uppercase mb-1">วันเกิด</p>
                                <p className="text-sm font-bold text-slate-800">
                                    {student.birthday
                                        ? new Date(student.birthday).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })
                                        : '-'}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase mb-1">ระดับชั้น</p>
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

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
                            <h3 className="font-bold text-gray-900 flex items-center justify-between border-b border-gray-100 pb-3">
                                <div className="flex items-center gap-2">
                                    <BookText size={18} className="text-blue-500" />
                                    คอร์สเรียนที่ลงทะเบียน
                                </div>
                                <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">
                                    {student.enrolledCourses?.length || 0} คอร์ส
                                </span>
                            </h3>

                            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-200">
                                {student.enrolledCourses && student.enrolledCourses.length > 0 ? (
                                    student.enrolledCourses.map((course: any, idx: number) => (
                                        <div key={idx} className="flex gap-3 p-3 rounded-xl border border-gray-100 hover:border-blue-100 bg-gray-50/50 hover:bg-blue-50/30 transition-colors">
                                            <div className="w-10 h-10 rounded-lg bg-white border border-gray-200 flex items-center justify-center shrink-0 shadow-sm">
                                                <BookText size={16} className="text-blue-500" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-gray-900 leading-tight">{course.title}</p>
                                                <p className="text-xs text-gray-500 mt-1">ผู้สอน: {course.instructorName}</p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-sm text-gray-400 italic text-center py-4">ยังไม่ลงคอร์สเรียนใดๆ</p>
                                )}
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
                            <h3 className="font-bold text-gray-900 flex items-center justify-between border-b border-gray-100 pb-3">
                                <div className="flex items-center gap-2">
                                    <CreditCard size={18} className="text-green-500" />
                                    ข้อมูลทางการเงิน
                                </div>
                            </h3>
                            <div className="bg-green-50 rounded-xl p-4 border border-green-100 flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-bold text-green-600 uppercase tracking-widest">ยอดซื้อรวม (Total Spent)</p>
                                    <p className="text-2xl font-black text-gray-900 mt-1">฿{(student.totalSpent || 0).toLocaleString()}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}