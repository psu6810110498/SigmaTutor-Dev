"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link'; // 🌟 1. เพิ่มการ Import Link
import {
    Users, Mail, Calendar, Search, Download,
    Eye, Pencil, ChevronLeft, ChevronRight,
    BookOpen, X, BookText
} from 'lucide-react';

export default function AdminStudentsPage() {
    const [students, setStudents] = useState<any[]>([]);
    const [courses, setCourses] = useState<any[]>([]);
    const [instructors, setInstructors] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<any | null>(null);

    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [courseFilter, setCourseFilter] = useState('all');
    const [instructorFilter, setInstructorFilter] = useState('all');

    const fetchData = async (isSilent = false) => {
        if (!isSilent) setLoading(true);
        try {
            const headers = { 'Content-Type': 'application/json' };

            const studentRes = await fetch('http://localhost:4000/api/users/students', { headers, credentials: 'include' });
            const studentData = await studentRes.json();

            const courseRes = await fetch('http://localhost:4000/api/courses/admin', { headers, credentials: 'include' });
            const courseData = await courseRes.json();

            const instRes = await fetch('http://localhost:4000/api/users/instructors', { headers, credentials: 'include' });
            const instData = await instRes.json();

            if (studentData.success) setStudents(studentData.data);
            if (courseData.success) {
                const courseList = courseData.data.courses || courseData.data;
                setCourses(Array.isArray(courseList) ? courseList : []);
            }
            if (instData.success) setInstructors(instData.data);

        } catch (error) {
            console.error("Fetch error:", error);
        } finally {
            if (!isSilent) setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();

        const interval = setInterval(() => {
            fetchData(true);
        }, 60000);

        return () => clearInterval(interval);
    }, []);

    const filteredStudents = useMemo(() => {
        const filtered = students.filter(s => {
            const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                s.email.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
            const matchesCourse = courseFilter === 'all' ||
                s.enrolledCourses?.some((c: any) => c.title === courseFilter);
            const matchesInstructor = instructorFilter === 'all' ||
                s.enrolledCourses?.some((c: any) => c.instructorName === instructorFilter);

            return matchesSearch && matchesStatus && matchesCourse && matchesInstructor;
        });

        return filtered.sort((a, b) => {
            if (a.status === 'Online' && b.status !== 'Online') return -1;
            if (a.status !== 'Online' && b.status === 'Online') return 1;
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
    }, [students, searchTerm, statusFilter, courseFilter, instructorFilter]);

    const openDrawer = (student: any) => {
        setSelectedStudent(student);
        setIsDrawerOpen(true);
        document.body.style.overflow = 'hidden';
    };

    const closeDrawer = () => {
        setIsDrawerOpen(false);
        setTimeout(() => setSelectedStudent(null), 300);
        document.body.style.overflow = 'auto';
    };

    return (
        <div className="p-6 space-y-6 animate-in fade-in duration-500 relative">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-900">จัดการนักเรียน</h1>
                    <p className="text-slate-500 text-sm mt-1">ข้อมูลนักเรียนและการลงทะเบียนทั้งหมดจากฐานข้อมูลจริง</p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200">
                    <Download size={18} /> ส่งออกข้อมูล (Export)
                </button>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-4 md:space-y-0 md:flex md:items-center md:gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="ค้นหาชื่อ, อีเมล..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-blue-100 text-sm outline-none"
                    />
                </div>

                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-2.5 bg-slate-50 border-none rounded-xl text-sm outline-none cursor-pointer font-bold text-slate-600"
                >
                    <option value="all">สถานะออนไลน์: ทั้งหมด</option>
                    <option value="Online">Online</option>
                    <option value="Offline">Offline</option>
                </select>

                <select
                    value={courseFilter}
                    onChange={(e) => setCourseFilter(e.target.value)}
                    className="px-4 py-2.5 bg-slate-50 border-none rounded-xl text-sm outline-none cursor-pointer font-bold text-slate-600 max-w-[200px]"
                >
                    <option value="all">คอร์สที่ลง: ทั้งหมด</option>
                    {courses.map((course: any) => (
                        <option key={course.id} value={course.title}>{course.title}</option>
                    ))}
                </select>

                <select
                    value={instructorFilter}
                    onChange={(e) => setInstructorFilter(e.target.value)}
                    className="px-4 py-2.5 bg-slate-50 border-none rounded-xl text-sm outline-none cursor-pointer font-bold text-slate-600"
                >
                    <option value="all">คุณครู: ทั้งหมด</option>
                    {instructors.map((inst: any) => (
                        <option key={inst.id} value={inst.name}>{inst.name} ({inst.nickname || 'ครู'})</option>
                    ))}
                </select>
            </div>

            <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-xl shadow-slate-200/40">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50/50 border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">นักเรียน / สถานะ</th>
                                <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">ข้อมูลติดต่อ</th>
                                <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">วันที่สมัคร</th>
                                <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center w-[15%]">คอร์สที่ลง</th>
                                <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest text-right">ยอดซื้อรวม</th>
                                <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">จัดการ</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? (
                                <tr><td colSpan={6} className="px-6 py-20 text-center text-slate-400 animate-pulse font-bold">กำลังโหลดข้อมูลนักเรียน...</td></tr>
                            ) : filteredStudents.length > 0 ? (
                                filteredStudents.map((student) => (
                                    <tr key={student.id} className="hover:bg-slate-50/30 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="relative">
                                                    <img
                                                        src={student.profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${student.id}`}
                                                        className="w-10 h-10 rounded-full object-cover bg-slate-800 text-white flex items-center justify-center font-bold text-sm shadow-inner ring-2 ring-white"
                                                        alt="Student Profile"
                                                    />
                                                    <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white shadow-sm
                                                        ${student.status === 'Online' ? 'bg-green-500 animate-pulse' : 'bg-slate-300'}`}
                                                    />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-900 text-sm">{student.name}</p>
                                                    <span className={`text-[10px] font-black uppercase tracking-tighter 
                                                        ${student.status === 'Online' ? 'text-green-500' : 'text-slate-400'}`}>
                                                        {student.status || 'Offline'}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-slate-600 text-xs flex items-center gap-1.5"><Mail size={12} /> {student.email}</p>
                                        </td>
                                        <td className="px-6 py-4 text-slate-900 text-xs font-bold text-center whitespace-nowrap">
                                            {new Date(student.createdAt).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}
                                        </td>

                                        <td className="px-6 py-4 text-center">
                                            {student.enrolledCourses && student.enrolledCourses.length > 0 ? (
                                                <button
                                                    onClick={() => openDrawer(student)}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg text-xs font-bold transition-colors border border-blue-100/50"
                                                >
                                                    <BookOpen size={14} /> {student.enrolledCourses.length} คอร์ส
                                                </button>
                                            ) : (
                                                <span className="text-slate-400 text-xs font-medium">ยังไม่ลงคอร์ส</span>
                                            )}
                                        </td>

                                        <td className="px-6 py-4 text-right">
                                            <p className="text-sm font-black text-slate-900">฿{(student.totalSpent || 0).toLocaleString()}</p>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                {/* 🌟 2. เชื่อม Link เข้ากับปุ่มดูและแก้ไข เพื่อให้กดใช้งานได้ */}
                                                <Link href={`/admin/students/${student.id}`}>
                                                    <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all" title="ดูข้อมูล">
                                                        <Eye size={16} />
                                                    </button>
                                                </Link>
                                                <Link href={`/admin/students/${student.id}/edit`}>
                                                    <button className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all" title="แก้ไข">
                                                        <Pencil size={16} />
                                                    </button>
                                                </Link>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan={6} className="px-6 py-20 text-center text-slate-400 italic font-bold">ไม่พบข้อมูลที่ตรงตามเงื่อนไข</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="px-6 py-4 bg-slate-50/30 border-t border-slate-100 flex items-center justify-between">
                    <p className="text-xs text-slate-500 font-bold">แสดงทั้งหมด {filteredStudents.length} รายการ</p>
                    <div className="flex gap-2">
                        <button className="p-1.5 border border-slate-200 rounded-lg text-slate-400 hover:bg-white transition-all disabled:opacity-30"><ChevronLeft size={16} /></button>
                        <button className="px-3 py-1 bg-blue-600 text-white rounded-lg text-xs font-bold shadow-md shadow-blue-100">1</button>
                        <button className="p-1.5 border border-slate-200 rounded-lg text-slate-400 hover:bg-white transition-all disabled:opacity-30"><ChevronRight size={16} /></button>
                    </div>
                </div>
            </div>

            {isDrawerOpen && (
                <div className="fixed inset-0 z-50 flex justify-end">
                    <div
                        className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm transition-opacity"
                        onClick={closeDrawer}
                    ></div>

                    <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                            <div>
                                <h2 className="text-lg font-black text-slate-900">คอร์สเรียนที่ลงทะเบียน</h2>
                                <p className="text-sm text-slate-500 font-medium">ของ {selectedStudent?.name}</p>
                            </div>
                            <button
                                onClick={closeDrawer}
                                className="p-2 hover:bg-slate-200 text-slate-500 rounded-full transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-4">
                            {selectedStudent?.enrolledCourses?.map((course: any, idx: number) => (
                                <div key={idx} className="flex gap-4 p-4 rounded-2xl border border-slate-100 hover:border-blue-100 hover:bg-blue-50/30 transition-colors group">
                                    <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                                        <BookText size={18} />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-700 transition-colors leading-tight">{course.title}</h3>
                                        <p className="text-xs text-slate-500 mt-1">ผู้สอน: <span className="font-medium text-slate-700">{course.instructorName}</span></p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="p-6 border-t border-slate-100 bg-slate-50">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-slate-500 font-medium">รวมทั้งหมด</span>
                                <span className="font-black text-slate-900 text-lg">{selectedStudent?.enrolledCourses?.length} คอร์ส</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}