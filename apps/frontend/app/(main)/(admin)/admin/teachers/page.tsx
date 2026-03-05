"use client";

import { useState, useEffect } from "react";
import {
    Users, Search, Filter, Mail, Phone, MoreVertical,
    Trash2, Edit, CheckCircle, XCircle, Plus, UserCheck
} from "lucide-react";
import { AdminTableLayout } from "@/app/components/layouts/AdminTableLayout";
import { Button } from "@/app/components/ui/Button";
import { useToast } from "@/app/components/ui/Toast";

export default function AdminTeachersPage() {
    const { toast } = useToast();
    const [teachers, setTeachers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    const fetchTeachers = async () => {
        try {
            setLoading(true);
            const res = await fetch('http://localhost:4000/api/users/instructors', {
                credentials: 'include'
            });
            const data = await res.json();
            if (data.success) {
                setTeachers(data.data);
            } else {
                toast.error("ไม่สามารถโหลดข้อมูลผู้สอนได้");
            }
        } catch (error) {
            console.error("Failed to fetch teachers:", error);
            toast.error("เกิดข้อผิดพลาดในการเชื่อมต่อ");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTeachers();
    }, []);

    const handleDelete = async (id: string) => {
        if (!confirm("คุณต้องการลบผู้สอนท่านนี้ใช่หรือไม่?")) return;
        try {
            const res = await fetch(`http://localhost:4000/api/users/${id}`, {
                method: 'DELETE',
                credentials: 'include'
            });
            const data = await res.json();
            if (data.success) {
                toast.success("ลบข้อมูลผู้สอนสำเร็จ");
                fetchTeachers();
            } else {
                toast.error(data.error || "ไม่สามารถลบข้อมูลได้");
            }
        } catch (error) {
            toast.error("เกิดข้อผิดพลาดในการลบข้อมูล");
        }
    };

    const filteredTeachers = teachers.filter(t =>
        t.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.nickname?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <AdminTableLayout
            title="จัดการผู้สอน"
            description="จัดการข้อมูลอาจารย์ ผู้ช่วยสอน และนักเขียนบทความ"
            icon={UserCheck}
            stats={[
                { label: "ผู้สอนทั้งหมด", value: teachers.length.toString(), icon: UserCheck, color: "blue" },
                { label: "กำลังออนไลน์", value: "0", icon: CheckCircle, color: "green" },
            ]}
            actions={
                <Button variant="primary">
                    <Plus size={18} className="mr-2" /> เพิ่มผู้สอนใหม่
                </Button>
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
                                <th className="px-6 py-4">ผู้สอน</th>
                                <th className="px-6 py-4">ข้อมูลติดต่อ</th>
                                <th className="px-6 py-4">ตำแหน่ง/วิชาที่สอน</th>
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
                            ) : filteredTeachers.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400 text-sm">
                                        ไม่พบข้อมูลผู้สอน
                                    </td>
                                </tr>
                            ) : (
                                filteredTeachers.map((teacher) => (
                                    <tr key={teacher.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-slate-100 overflow-hidden ring-2 ring-white shadow-sm shrink-0">
                                                    <img
                                                        src={teacher.profileImage || `https://api.dicebear.com/9.x/avataaars/svg?seed=${teacher.id}`}
                                                        alt={teacher.name}
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-slate-900 leading-none">{teacher.name}</p>
                                                    <p className="text-xs text-blue-600 font-medium mt-1">
                                                        {teacher.nickname ? `@${teacher.nickname}` : "ไม่ระบุชื่อเล่น"}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                                    <Mail size={12} className="text-slate-300" />
                                                    {teacher.email}
                                                </div>
                                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                                    <Phone size={12} className="text-slate-300" />
                                                    {teacher.phone || "-"}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-wrap gap-1">
                                                <span className="px-2 py-1 bg-slate-100 text-slate-600 text-[10px] font-bold rounded">
                                                    {teacher.role || "Instructor"}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-green-50 text-green-600 border border-green-100">
                                                พร้อมสอน
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-blue-600 hover:bg-blue-50">
                                                    <Edit size={14} />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50"
                                                    onClick={() => handleDelete(teacher.id)}
                                                >
                                                    <Trash2 size={14} />
                                                </Button>
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