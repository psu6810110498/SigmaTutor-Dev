"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, User, MapPin, Camera, GraduationCap } from 'lucide-react';
import { useToast } from "@/app/components/ui/Toast";

export default function EditStudentPage() {
    const router = useRouter();
    const params = useParams();
    const { toast } = useToast();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [profileImage, setProfileImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    // อิงตาม Schema ที่มีใน Database
    const [formData, setFormData] = useState({
        name: '',
        nickname: '',
        phone: '',
        birthday: '',
        educationLevel: '',
        school: '',
        province: '',
        address: '',
        email: '' // เอาไว้โชว์เฉยๆ (ห้ามแก้)
    });

    useEffect(() => {
        const fetchStudentData = async () => {
            try {
                // ดึงข้อมูลส่วนตัวจาก API ที่เราเพิ่งสร้าง
                const res = await fetch((process.env.NEXT_PUBLIC_API_URL || `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'}`) + `/users/${params.id}`, {
                    method: 'GET',
                    credentials: 'include'
                });

                const data = await res.json();

                if (data.success && data.data) {
                    const student = data.data;
                    setFormData({
                        name: student.name || '',
                        nickname: student.nickname || '',
                        phone: student.phone || '',
                        birthday: student.birthday ? new Date(student.birthday).toISOString().split('T')[0] : '',
                        educationLevel: student.educationLevel || '',
                        school: student.school || '',
                        province: student.province || '',
                        address: student.address || '',
                        email: student.email || ''
                    });

                    if (student.profileImage) {
                        setImagePreview(student.profileImage);
                    } else {
                        setImagePreview(`https://api.dicebear.com/9.x/avataaars/svg?seed=${student.id}`);
                    }
                } else {
                    toast.error("ไม่พบข้อมูลนักเรียน");
                    router.push('/admin/students');
                }
            } catch (error) {
                toast.error("ดึงข้อมูลไม่สำเร็จ");
            } finally {
                setLoading(false);
            }
        };

        if (params.id) fetchStudentData();
    }, [params.id, router, toast]);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                toast.error("ไฟล์รูปภาพต้องไม่เกิน 2MB");
                return;
            }
            setProfileImage(file);
            const reader = new FileReader();
            reader.onloadend = () => { setImagePreview(reader.result as string); };
            reader.readAsDataURL(file);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const submitData = new FormData();

            if (profileImage) submitData.append('profileImage', profileImage);

            // ใส่ข้อมูล Text ลงไปใน FormData
            Object.entries(formData).forEach(([key, value]) => {
                if (key !== 'email') { // ไม่ส่ง email ไปอัปเดต
                    submitData.append(key, value);
                }
            });

            const res = await fetch((process.env.NEXT_PUBLIC_API_URL || `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'}`) + `/users/${params.id}`, {
                method: 'PATCH',
                credentials: 'include',
                body: submitData
            });
            const data = await res.json();

            if (data.success) {
                toast.success('บันทึกข้อมูลนักเรียนสำเร็จ');
                router.push('/admin/students');
            } else {
                toast.error(data.error || 'บันทึกไม่สำเร็จ');
            }
        } catch (error) {
            toast.error('เชื่อมต่อเซิร์ฟเวอร์ล้มเหลว');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <div className="flex h-[60vh] flex-col items-center justify-center space-y-4">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm font-medium text-slate-500">กำลังโหลดข้อมูลนักเรียน...</p>
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
                        <h1 className="text-2xl font-black text-slate-900">แก้ไขโปรไฟล์นักเรียน</h1>
                        <p className="text-sm text-slate-500 mt-1">อัปเดตข้อมูลส่วนตัวและที่อยู่ของนักเรียน</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Link href="/admin/students" className="px-4 py-2 text-sm font-bold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-all shadow-sm">
                        ยกเลิก
                    </Link>
                    <button
                        onClick={handleSubmit}
                        disabled={saving}
                        className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Save size={16} /> {saving ? 'กำลังบันทึก...' : 'บันทึกการเปลี่ยนแปลง'}
                    </button>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">

                {/* 🌟 Section 1: ข้อมูลบัญชีและโปรไฟล์ */}
                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="px-6 py-5 border-b border-slate-100 flex items-center gap-2 bg-slate-50/50">
                        <User size={18} className="text-slate-500" />
                        <h2 className="text-sm font-black text-slate-800 uppercase tracking-wide">ข้อมูลบัญชีและรูปภาพ</h2>
                    </div>

                    <div className="p-6 md:p-8 flex flex-col md:flex-row gap-8">
                        {/* Profile Image Column */}
                        <div className="flex flex-col items-center space-y-4">
                            <div className="relative group w-32 h-32 rounded-full border border-slate-200 shadow-sm overflow-hidden bg-slate-50 flex items-center justify-center">
                                {imagePreview ? (
                                    <img src={imagePreview} className="w-full h-full object-cover" alt="Profile" />
                                ) : (
                                    <User size={40} className="text-slate-300" />
                                )}
                                <label htmlFor="pfp" className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                                    <Camera size={24} className="text-white" />
                                </label>
                            </div>
                            <input type="file" accept="image/*" id="pfp" onChange={handleImageChange} className="hidden" />
                            <div className="text-center">
                                <label htmlFor="pfp" className="text-sm font-bold text-blue-600 hover:text-blue-700 cursor-pointer">เปลี่ยนรูปภาพ</label>
                                <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold">JPG, PNG ไม่เกิน 2MB</p>
                            </div>
                        </div>

                        {/* Input Fields Column */}
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">ชื่อ-นามสกุล <span className="text-red-500">*</span></label>
                                <input name="name" value={formData.name} onChange={handleChange} required className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-slate-900 text-sm font-medium transition-all" placeholder="กรอกชื่อ-นามสกุล" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">ชื่อเล่น</label>
                                <input name="nickname" value={formData.nickname} onChange={handleChange} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-slate-900 text-sm font-medium transition-all" placeholder="กรอกชื่อเล่น" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">อีเมล (บัญชีผู้ใช้)</label>
                                <input value={formData.email} disabled className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 text-sm font-medium cursor-not-allowed" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">เบอร์โทรศัพท์</label>
                                <input name="phone" value={formData.phone} onChange={handleChange} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-slate-900 text-sm font-medium transition-all" placeholder="08X-XXX-XXXX" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* 🌟 Section 2: ข้อมูลการศึกษาและที่อยู่ */}
                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="px-6 py-5 border-b border-slate-100 flex items-center gap-2 bg-slate-50/50">
                        <GraduationCap size={18} className="text-slate-500" />
                        <h2 className="text-sm font-black text-slate-800 uppercase tracking-wide">ข้อมูลเพิ่มเติม (Education & Location)</h2>
                    </div>

                    <div className="p-6 md:p-8 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">ระดับชั้นปัจจุบัน</label>
                                <select name="educationLevel" value={formData.educationLevel} onChange={handleChange} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-slate-900 text-sm font-medium transition-all cursor-pointer">
                                    <option value="">เลือกระดับชั้น</option>
                                    <option value="ประถม">ประถมศึกษา</option>
                                    <option value="ม.ต้น">มัธยมศึกษาตอนต้น</option>
                                    <option value="ม.ปลาย">มัธยมศึกษาตอนปลาย</option>
                                    <option value="มหาวิทยาลัย">มหาวิทยาลัย</option>
                                    <option value="อื่นๆ">อื่นๆ</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">ชื่อโรงเรียน / สถาบัน</label>
                                <input name="school" value={formData.school} onChange={handleChange} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-slate-900 text-sm font-medium transition-all" placeholder="เช่น โรงเรียนเตรียมอุดมศึกษา" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">วัน/เดือน/ปีเกิด</label>
                                <input type="date" name="birthday" value={formData.birthday} onChange={handleChange} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-slate-900 text-sm font-medium transition-all cursor-pointer" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">จังหวัด</label>
                                <input name="province" value={formData.province} onChange={handleChange} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-slate-900 text-sm font-medium transition-all" placeholder="เช่น กรุงเทพมหานคร" />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase flex items-center gap-1"><MapPin size={14} /> ที่อยู่จัดส่งเอกสาร</label>
                            <textarea name="address" value={formData.address} onChange={handleChange} rows={3} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-slate-900 text-sm font-medium transition-all resize-none" placeholder="บ้านเลขที่, หมู่, ซอย, ถนน, ตำบล, อำเภอ, จังหวัด, รหัสไปรษณีย์..." />
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
}