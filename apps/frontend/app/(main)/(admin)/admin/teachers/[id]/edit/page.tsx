"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, User, Briefcase, Camera, AlertCircle } from 'lucide-react';
import { useToast } from "@/app/components/ui/Toast";
import { useAuth } from "@/app/context/AuthContext";

export default function EditTeacherPage() {
    const router = useRouter();
    const params = useParams();
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const { user } = useAuth();

    const [profileImage, setProfileImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        name: '', nickname: '', title: '', bio: '', expertise: '', education: '', experience: '', socialLink: ''
    });

    useEffect(() => {
        const fetchTeacherData = async () => {
            try {
                const res = await fetch(`http://localhost:4000/api/users/instructors?t=${Date.now()}`, {
                    method: 'GET',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' }
                });

                const data = await res.json();

                if (data.success) {
                    const teacher = data.data.find((t: any) => String(t.id) === String(params.id));

                    if (teacher) {
                        setFormData({
                            name: teacher.name || '', nickname: teacher.nickname || '', title: teacher.title || '',
                            bio: teacher.bio || '', expertise: teacher.expertise || '', education: teacher.education || '',
                            experience: teacher.experience || '', socialLink: teacher.socialLink || ''
                        });
                        if (teacher.profileImage) {
                            setImagePreview(teacher.profileImage);
                        } else {
                            setImagePreview(`https://api.dicebear.com/9.x/avataaars/svg?seed=${params.id}`);
                        }
                    } else {
                        toast.error("ไม่พบข้อมูลคุณครู");
                        router.push('/admin/teachers');
                    }
                } else {
                    console.error("API Error:", data.error);
                }
            } catch (error) {
                console.error("Fetch Error:", error);
                toast.error("ดึงข้อมูลไม่สำเร็จ");
            } finally {
                setLoading(false);
            }
        };

        if (params.id) {
            fetchTeacherData();
        }
    }, [params.id, router, toast]);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) { toast.error("ไฟล์รูปภาพต้องไม่เกิน 2MB"); return; }
            setProfileImage(file);
            const reader = new FileReader();
            reader.onloadend = () => { setImagePreview(reader.result as string); };
            reader.readAsDataURL(file);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const submitData = new FormData();

            if (profileImage) submitData.append('profileImage', profileImage);
            Object.entries(formData).forEach(([key, value]) => { submitData.append(key, value); });

            const res = await fetch(`http://localhost:4000/api/users/${params.id}`, {
                method: 'PATCH',
                credentials: 'include',
                body: submitData
            });
            const data = await res.json();

            if (data.success) {
                toast.success('บันทึกข้อมูลสำเร็จ');
                router.push('/admin/teachers');
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
            <p className="text-sm font-medium text-gray-500">กำลังโหลดข้อมูล...</p>
        </div>
    );

    return (
        <div className="p-4 md:p-8 max-w-5xl mx-auto">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-4">
                    <Link href="/admin/teachers" className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500">
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">แก้ไขโปรไฟล์คุณครู</h1>
                        <p className="text-sm text-gray-500 mt-1">อัปเดตข้อมูลส่วนตัวและประวัติการสอน</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Link href="/admin/teachers" className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all shadow-sm">
                        ยกเลิก
                    </Link>
                    <button
                        onClick={handleSubmit}
                        disabled={saving}
                        className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Save size={16} /> {saving ? 'กำลังบันทึก...' : 'บันทึกการเปลี่ยนแปลง'}
                    </button>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">

                {/* 🌟 Section 1: Basic Info & Profile Image */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="px-6 py-5 border-b border-gray-100 flex items-center gap-2 bg-gray-50/50">
                        <User size={18} className="text-gray-500" />
                        <h2 className="text-base font-semibold text-gray-800">ข้อมูลพื้นฐาน (Basic Information)</h2>
                    </div>

                    <div className="p-6 md:p-8 flex flex-col md:flex-row gap-8">
                        {/* Profile Image Column */}
                        <div className="flex flex-col items-center space-y-4">
                            <div className="relative group w-32 h-32 rounded-full border border-gray-200 shadow-sm overflow-hidden bg-gray-50 flex items-center justify-center">
                                {imagePreview ? (
                                    <img src={imagePreview} className="w-full h-full object-cover" alt="Profile" />
                                ) : (
                                    <User size={40} className="text-gray-300" />
                                )}
                                <label htmlFor="pfp" className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                                    <Camera size={24} className="text-white" />
                                </label>
                            </div>
                            <input type="file" accept="image/*" id="pfp" onChange={handleImageChange} className="hidden" />
                            <div className="text-center">
                                <label htmlFor="pfp" className="text-sm font-medium text-blue-600 hover:text-blue-700 cursor-pointer">เปลี่ยนรูปภาพ</label>
                                <p className="text-xs text-gray-500 mt-1">ไฟล์ JPG, PNG ขนาดไม่เกิน 2MB</p>
                            </div>
                        </div>

                        {/* Input Fields Column */}
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">ชื่อ-นามสกุลจริง <span className="text-red-500">*</span></label>
                                <input name="name" value={formData.name} onChange={handleChange} required className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-gray-900 sm:text-sm transition-all shadow-sm" placeholder="กรอกชื่อ-นามสกุล" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">ชื่อเล่น</label>
                                <input name="nickname" value={formData.nickname} onChange={handleChange} className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-gray-900 sm:text-sm transition-all shadow-sm" placeholder="กรอกชื่อเล่น" />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">ตำแหน่งวิชาการ / สโลแกนประจำตัว</label>
                                <input name="title" value={formData.title} onChange={handleChange} className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-gray-900 sm:text-sm transition-all shadow-sm" placeholder="เช่น ผู้เชี่ยวชาญด้านคณิตศาสตร์ หรือ ติวเตอร์ฟิสิกส์อันดับ 1" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* 🌟 Section 2: Professional Info */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="px-6 py-5 border-b border-gray-100 flex items-center gap-2 bg-gray-50/50">
                        <Briefcase size={18} className="text-gray-500" />
                        <h2 className="text-base font-semibold text-gray-800">ประวัติและข้อมูลเชิงลึก (Professional Details)</h2>
                    </div>

                    <div className="p-6 md:p-8 space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">ประวัติการทำงาน / Bio</label>
                            <textarea name="bio" value={formData.bio} onChange={handleChange} rows={4} className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-gray-900 sm:text-sm transition-all shadow-sm resize-y" placeholder="เขียนประวัติย่อหรือคำแนะนำตัวที่น่าสนใจ..." />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">ความเชี่ยวชาญ (Expertise)</label>
                                <input name="expertise" value={formData.expertise} onChange={handleChange} className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-gray-900 sm:text-sm transition-all shadow-sm" placeholder="เช่น คณิตศาสตร์ประยุกต์, IELTS" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">ประวัติการศึกษา (Education)</label>
                                <input name="education" value={formData.education} onChange={handleChange} className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-gray-900 sm:text-sm transition-all shadow-sm" placeholder="เช่น ปริญญาโท วิศวกรรมศาสตร์ ม.จุฬาฯ" />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">ประสบการณ์สอน (Experience)</label>
                            <textarea name="experience" value={formData.experience} onChange={handleChange} rows={2} className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-gray-900 sm:text-sm transition-all shadow-sm resize-y" placeholder="เช่น ประสบการณ์สอนกวดวิชามากกว่า 5 ปี..." />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">ลิงก์เว็บไซต์ / โซเชียลมีเดีย</label>
                            <div className="flex rounded-lg shadow-sm">
                                <span className="inline-flex items-center px-4 rounded-l-lg border border-r-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">
                                    https://
                                </span>
                                <input type="text" name="socialLink" value={formData.socialLink} onChange={handleChange} placeholder="www.facebook.com/..." className="flex-1 block w-full px-4 py-2.5 min-w-0 rounded-none rounded-r-lg bg-white border border-gray-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-gray-900 sm:text-sm transition-all" />
                            </div>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
}