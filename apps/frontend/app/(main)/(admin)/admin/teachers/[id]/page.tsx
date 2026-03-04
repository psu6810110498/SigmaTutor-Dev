"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, User, Briefcase, Mail, BookOpen, Star } from 'lucide-react';
import { useToast } from "@/app/components/ui/Toast";

export default function AdminTeacherViewPage() {
    const params = useParams();
    const router = useRouter();
    const { toast } = useToast();

    const [teacher, setTeacher] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const id = params.id as string;

    useEffect(() => {
        const fetchTeacher = async () => {
            try {
                const res = await fetch(`http://localhost:4000/api/users/${id}`, {
                    credentials: 'include'
                });
                const data = await res.json();

                if (data.success) {
                    setTeacher(data.data);
                } else {
                    toast.error("ไม่สามารถโหลดข้อมูลคุณครูได้");
                    router.push('/admin/teachers');
                }
            } catch (error) {
                console.error(error);
                toast.error("เกิดข้อผิดพลาดในการโหลดข้อมูล");
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchTeacher();
    }, [id, router, toast]);

    if (loading) {
        return <div className="p-8 text-center text-gray-500 animate-pulse font-medium">กำลังโหลดข้อมูล...</div>;
    }

    if (!teacher) return null;

    return (
        <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/admin/teachers" className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500">
                    <ArrowLeft size={20} />
                </Link>
                <div>
                    <h1 className="text-2xl font-black text-gray-900">ข้อมูลคุณครู (ดูเท่านั้น)</h1>
                    <p className="text-sm text-gray-500 mt-1">รายละเอียดและประวัติของคุณครู</p>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden p-6 md:p-8">
                <div className="flex flex-col md:flex-row gap-8 items-start">
                    <div className="shrink-0">
                        <img
                            src={teacher.profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${teacher.id}`}
                            alt={teacher.name}
                            className="w-32 h-32 md:w-40 md:h-40 rounded-full object-cover border-4 border-gray-50 shadow-md"
                        />
                    </div>

                    <div className="flex-1 space-y-4">
                        <div>
                            <div className="flex items-center gap-3">
                                <h2 className="text-2xl font-bold text-gray-900">{teacher.name}</h2>
                                {teacher.nickname && (
                                    <span className="px-2.5 py-1 bg-blue-50 text-blue-600 text-xs font-bold rounded-lg uppercase tracking-wider border border-blue-100">
                                        {teacher.nickname}
                                    </span>
                                )}
                            </div>
                            <p className="text-lg text-gray-500 font-medium mt-1">{teacher.title || 'Sigma Instructor'}</p>
                        </div>

                        {teacher.email && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Mail size={16} />
                                <span>{teacher.email}</span>
                            </div>
                        )}

                        {teacher.socialLink && (
                            <div className="flex items-center gap-2 text-sm text-blue-600">
                                <BookOpen size={16} /> {/* Placeholder icon */}
                                <a href={teacher.socialLink.startsWith('http') ? teacher.socialLink : `https://${teacher.socialLink}`} target="_blank" rel="noopener noreferrer" className="hover:underline">
                                    {teacher.socialLink}
                                </a>
                            </div>
                        )}

                        {teacher.bio && (
                            <div className="mt-4 pt-4 border-t border-gray-100">
                                <h3 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
                                    <User size={16} className="text-gray-400" />
                                    ประวัติส่วนตัว (Bio)
                                </h3>
                                <p className="text-sm text-gray-600 leading-relaxed max-w-2xl whitespace-pre-wrap">{teacher.bio}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
                    <h3 className="font-bold text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-3">
                        <Briefcase size={18} className="text-indigo-500" />
                        ความเชี่ยวชาญ & การศึกษา
                    </h3>
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">ความเชี่ยวชาญ (Expertise)</p>
                        <p className="text-sm text-gray-800 font-medium">{teacher.expertise || '-'}</p>
                    </div>
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">การศึกษา (Education)</p>
                        <p className="text-sm text-gray-800 font-medium">{teacher.education || '-'}</p>
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
                    <h3 className="font-bold text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-3">
                        <Star size={18} className="text-yellow-500" />
                        ประสบการณ์สอน
                    </h3>
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">ประสบการณ์ (Experience)</p>
                        <p className="text-sm text-gray-800 font-medium whitespace-pre-wrap">{teacher.experience || '-'}</p>
                    </div>
                </div>
            </div>

        </div>
    );
}
