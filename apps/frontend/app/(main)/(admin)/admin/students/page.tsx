"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { 
    Users, Mail, Calendar, Search, Download, 
    Eye, Pencil, ChevronLeft, ChevronRight 
} from 'lucide-react';

export default function AdminStudentsPage() {
    const [students, setStudents] = useState<any[]>([]);
    const [courses, setCourses] = useState<any[]>([]);
    const [instructors, setInstructors] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // ── Filter States ──────────────────────────────
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [courseFilter, setCourseFilter] = useState('all');
    const [instructorFilter, setInstructorFilter] = useState('all');

    const getToken = () => localStorage.getItem('accessToken') || localStorage.getItem('token') || '';

    const fetchData = async () => {
        setLoading(true);
        try {
            const token = getToken();
            const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

            // 1. ดึงข้อมูลนักเรียนพร้อมข้อมูล Enrollments และ Payments จริง
            const studentRes = await fetch('http://localhost:4000/api/users/students', { headers, credentials: 'include' });
            const studentData = await studentRes.json();

            // 2. ดึงข้อมูลคอร์สทั้งหมดเพื่อใช้ใน Dropdown ตัวกรอง
            const courseRes = await fetch('http://localhost:4000/api/courses/admin', { headers, credentials: 'include' });
            const courseData = await courseRes.json();

            // 3. ดึงรายชื่อคุณครูเพื่อใช้ใน Dropdown ตัวกรอง
            const instRes = await fetch('http://localhost:4000/api/users/instructors', { headers, credentials: 'include' });
            const instData = await instRes.json();

            if (studentData.success) setStudents(studentData.data);
            if (courseData.success) {
                // รองรับข้อมูลทั้งแบบมี pagination และ array เปล่าๆ
                const courseList = courseData.data.courses || courseData.data;
                setCourses(Array.isArray(courseList) ? courseList : []);
            }
            if (instData.success) setInstructors(instData.data);

        } catch (error) {
            console.error("Fetch error:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // ── Filtering Logic (เชื่อมโยงกับข้อมูลจริงใน DB) ───────────────
    const filteredStudents = useMemo(() => {
        return students.filter(s => {
            const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                 s.email.toLowerCase().includes(searchTerm.toLowerCase());
            
            // กรองตามสถานะ Online/Offline
            const matchesStatus = statusFilter === 'all' || s.status === statusFilter;

            // กรองตามรายชื่อคอร์สที่ลงเรียนจริง
            const matchesCourse = courseFilter === 'all' || 
                                 s.enrolledCourses?.some((c: any) => c.title === courseFilter);

            // กรองตามชื่อคุณครูที่สอนในคอร์สนั้นๆ
            const matchesInstructor = instructorFilter === 'all' || 
                                     s.enrolledCourses?.some((c: any) => c.instructorName === instructorFilter);

            return matchesSearch && matchesStatus && matchesCourse && matchesInstructor;
        });
    }, [students, searchTerm, statusFilter, courseFilter, instructorFilter]);

    return (
        <div className="p-6 space-y-6 animate-in fade-in duration-500">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-900">จัดการนักเรียน</h1>
                    <p className="text-slate-500 text-sm mt-1">ข้อมูลนักเรียนและการลงทะเบียนทั้งหมดจากฐานข้อมูลจริง</p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200">
                    <Download size={18} /> ส่งออกข้อมูล (Export)
                </button>
            </div>

            {/* Dropdown Bar Section */}
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

            {/* Table Section */}
            <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-xl shadow-slate-200/40">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50/50 border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">นักเรียน / สถานะ</th>
                                <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">ข้อมูลติดต่อ</th>
                                <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">วันที่สมัคร</th>
                                <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">คอร์สที่ลง</th>
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
                                                    <div className="w-10 h-10 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-sm shadow-inner">
                                                        {student.name ? student.name.charAt(0) : '?'}
                                                    </div>
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
                                            <p className="text-slate-600 text-xs flex items-center gap-1.5"><Mail size={12}/> {student.email}</p>
                                        </td>
                                        <td className="px-6 py-4 text-slate-900 text-xs font-bold text-center">
                                            {new Date(student.createdAt).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-wrap gap-1">
                                                {/* ✅ แสดงคอร์สจริงที่ดึงจาก Relation Enrollment ใน DB */}
                                                {student.enrolledCourses && student.enrolledCourses.length > 0 ? (
                                                    student.enrolledCourses.map((c: any, idx: number) => (
                                                        <span key={idx} className="bg-slate-100 text-slate-600 px-2 py-1 rounded-lg text-[10px] font-bold">
                                                            {c.title} <span className="text-slate-400">({c.instructorName})</span>
                                                        </span>
                                                    ))
                                                ) : (
                                                    <span className="text-slate-400 text-[10px] italic">ยังไม่ลงคอร์ส</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {/* ✅ แสดงยอดรวมเงินจริงที่จ่ายสำเร็จจากตาราง Payment */}
                                            <p className="text-sm font-black text-slate-900">฿{(student.totalSpent || 0).toLocaleString()}</p>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all" title="ดูข้อมูล"><Eye size={16}/></button>
                                                <button className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all" title="แก้ไข"><Pencil size={16}/></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan={6} className="px-6 py-20 text-center text-slate-400 italic">ไม่พบข้อมูลที่ตรงตามเงื่อนไข</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="px-6 py-4 bg-slate-50/30 border-t border-slate-100 flex items-center justify-between">
                    <p className="text-xs text-slate-500 font-bold">แสดงทั้งหมด {filteredStudents.length} รายการ</p>
                    <div className="flex gap-2">
                        <button className="p-1.5 border border-slate-200 rounded-lg text-slate-400 hover:bg-white transition-all disabled:opacity-30"><ChevronLeft size={16}/></button>
                        <button className="px-3 py-1 bg-blue-600 text-white rounded-lg text-xs font-bold shadow-md shadow-blue-100">1</button>
                        <button className="p-1.5 border border-slate-200 rounded-lg text-slate-400 hover:bg-white transition-all disabled:opacity-30"><ChevronRight size={16}/></button>
                    </div>
                </div>
            </div>
        </div>
    );
}