"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
    Users, Search, Filter, Mail, Phone, MoreVertical,
    Trash2, Edit, CheckCircle, XCircle, Plus, Eye,
    GraduationCap, MapPin, Calendar, BookOpen
} from "lucide-react";
import { AdminTableLayout } from "@/app/components/layouts/AdminTableLayout";
import { Button } from "@/app/components/ui/Button";
import { useToast } from "@/app/components/ui/Toast";

export default function AdminStudentsPage() {
    const { toast } = useToast();
    const [students, setStudents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedStudent, setSelectedStudent] = useState<any>(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    const fetchStudents = async () => {
        try {
            setLoading(true);
            const res = await fetch('http://localhost:4000/api/users/students', {
                credentials: 'include'
            });
            const data = await res.json();
            if (data.success) {
                setStudents(data.data);
            } else {
                toast.error("ไม่สามารถโหลดข้อมูลนักเรียนได้");
            }
        } catch (error) {
            console.error("Failed to fetch students:", error);
            toast.error("เกิดข้อผิดพลาดในการเชื่อมต่อ");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStudents();
    }, []);

    const filteredStudents = useMemo(() => {
        return students.filter(s =>
            s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.nickname?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [students, searchTerm]);

    const stats = [
        { label: "นักเรียนทั้งหมด", value: students.length.toString(), icon: Users, color: "blue" },
        { label: "สมัครใหม่เดือนนี้", value: "0", icon: Calendar, color: "purple" },
    ];

    return (
        <AdminTableLayout
            title="จัดการนักเรียน"
            description="ดูข้อมูลประวัติ การเข้าเรียน และผลการเรียนของนักเรียนทั้งหมด"
            icon={Users}
            stats={stats}
            actions={
                <Link href="/admin/students/create">
                    <Button variant="primary">
                        <Plus size={18} className="mr-2" /> เพิ่มนักเรียนใหม่
                    </Button>
                </Link>
            }
        >
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                {/* Search & Filter Bar */}
                <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row gap-4 items-center justify-between bg-slate-50/50">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="ค้นหาชื่อ, อีเมล หรือชื่อเล่น..."
                            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                            <Filter size={16} className="mr-2" /> ตัวกรอง
                        </Button>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-widest border-b border-slate-100">
                                <th className="px-6 py-4">นักเรียน</th>
                                <th className="px-6 py-4">ข้อมูลติดต่อ</th>
                                <th className="px-6 py-4">ระดับชั้น/โรงเรียน</th>
                                <th className="px-6 py-4">สถานะ</th>
                                <th className="px-6 py-4 text-right">จัดการ</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400 text-sm animate-pulse">
                                        กำลังโหลดข้อมูล...
                                    </td>
                                </tr>
                            ) : filteredStudents.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400 text-sm">
                                        ไม่พบข้อมูลนักเรียน
                                    </td>
                                </tr>
                            ) : (
                                filteredStudents.map((student) => (
                                    <tr key={student.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-slate-100 overflow-hidden ring-2 ring-white shadow-sm shrink-0">
                                                    <img
                                                        src={student.profileImage || `https://api.dicebear.com/9.x/avataaars/svg?seed=${student.id}`}
                                                        alt={student.name}
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-slate-900 leading-none">{student.name}</p>
                                                    <p className="text-xs text-blue-600 font-medium mt-1">
                                                        {student.nickname ? `@${student.nickname}` : "ไม่ระบุชื่อเล่น"}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                                    <Mail size={12} className="text-slate-300" />
                                                    {student.email}
                                                </div>
                                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                                    <Phone size={12} className="text-slate-300" />
                                                    {student.phone || "-"}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="space-y-1">
                                                <p className="text-xs font-bold text-slate-700">{student.educationLevel || "-"}</p>
                                                <p className="text-[10px] text-slate-500 truncate max-w-[150px]">{student.school || "-"}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${student.status === 'Online'
                                                    ? 'bg-green-50 text-green-600 border-green-100'
                                                    : 'bg-slate-50 text-slate-400 border-slate-100'
                                                }`}>
                                                {student.status || 'Offline'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Link href={`/admin/students/${student.id}`}>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-blue-600 hover:bg-blue-50">
                                                        <Eye size={14} />
                                                    </Button>
                                                </Link>
                                                <Link href={`/admin/students/${student.id}/edit`}>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-blue-600 hover:bg-blue-50">
                                                        <Edit size={14} />
                                                    </Button>
                                                </Link>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </AdminTableLayout>
    );
}