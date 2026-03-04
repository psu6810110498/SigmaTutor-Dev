"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, User, Mail, Calendar, BookText, CreditCard } from 'lucide-react';
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
                // Actually we just fetch from students list to find the matched student
                // (or if there is an endpoint for a single user, use it. For now, we fetch list)
                const res = await fetch(`http://localhost:4000/api/users/students`, {
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
        <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/admin/students" className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500">
                    <ArrowLeft size={20} />
                </Link>
                <div>
                    <h1 className="text-2xl font-black text-gray-900">ข้อมูลนักเรียน (ดูเท่านั้น)</h1>
                    <p className="text-sm text-gray-500 mt-1">รายละเอียดและประวัติการลงทะเบียนของนักเรียน</p>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden p-6 md:p-8">
                <div className="flex flex-col md:flex-row gap-8 items-start">
                    <div className="shrink-0 relative">
                        <img
                            src={student.profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${student.id}`}
                            alt={student.name}
                            className="w-32 h-32 md:w-40 md:h-40 rounded-full object-cover border-4 border-gray-50 shadow-md"
                        />
                        <div className={`absolute bottom-2 right-2 w-5 h-5 rounded-full border-4 border-white shadow-sm
                            ${student.status === 'Online' ? 'bg-green-500 animate-pulse' : 'bg-slate-300'}`}
                        />
                    </div>

                    <div className="flex-1 space-y-4">
                        <div>
                            <div className="flex items-center gap-3">
                                <h2 className="text-2xl font-bold text-gray-900">{student.name}</h2>
                                <span className={`text-xs font-black uppercase tracking-tighter px-2 py-1 rounded
                                    ${student.status === 'Online' ? 'bg-green-50 text-green-600 border border-green-200' : 'bg-slate-50 text-slate-500 border border-slate-200'}`}>
                                    {student.status || 'Offline'}
                                </span>
                            </div>
                        </div>

                        <div className="space-y-2 mt-4">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Mail size={16} className="text-gray-400" />
                                <span>{student.email || '-'}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Calendar size={16} className="text-gray-400" />
                                <span>วันที่สมัคร: {new Date(student.createdAt).toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                            </div>
                        </div>
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
    );
}