"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, User, Briefcase, Camera } from 'lucide-react';
import { useToast } from "@/app/components/ui/Toast";
import { useAuth } from "@/app/context/AuthContext";

export default function CreateTeacherPage() {
    const router = useRouter();
    const { toast } = useToast();
    const { token, user } = useAuth(); // 🌟 ใช้ระบบ Token จาก AuthContext

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);
    
    // ไว้โชว์รูปที่เลือกทันที
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    const [formData, setFormData] = useState({ 
        name: '', nickname: '', title: '', bio: '', 
        profileImage: '', expertise: '', education: '', 
        experience: '', socialLink: ''    
    });

    // 🌟 ฟังก์ชันจัดการรูปภาพ (ใช้โค้ดอัปโหลดเดิมของคุณ ผสมกับ UI ใหม่)
    const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // โชว์รูป Preview ให้แอดมินดูก่อน
        const reader = new FileReader();
        reader.onloadend = () => { setImagePreview(reader.result as string); };
        reader.readAsDataURL(file);

        setUploadingImage(true);
        try {
            const uploadData = new FormData();
            uploadData.append("file", file);
            
            const currentToken = token || (user as any)?.token || localStorage.getItem('token');
            
            // ยิงไปที่ API อัปโหลดไฟล์เดิมของคุณ
            const res = await fetch('http://localhost:4000/api/courses/upload/pdf', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${currentToken}` },
                credentials: 'include',
                body: uploadData
            });
            const data = await res.json();
            
            if (data.success) {
                // เก็บ URL ที่ได้จากการอัปโหลดลงใน formData
                setFormData(prev => ({ ...prev, profileImage: data.url }));
                toast.success("อัปโหลดรูปภาพโปรไฟล์เรียบร้อย");
            }
        } catch (error) {
            toast.error("อัปโหลดรูปภาพล้มเหลว");
        } finally {
            setUploadingImage(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const currentToken = token || (user as any)?.token || localStorage.getItem('token');
            const res = await fetch('http://localhost:4000/api/users/instructors', {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${currentToken}`, 
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify(formData)
            });
            const data = await res.json();
            
            if (data.success) {
                toast.success('เพิ่มคุณครูใหม่เรียบร้อยแล้ว');
                router.push('/admin/teachers'); 
            } else {
                toast.error(data.error || 'เกิดข้อผิดพลาด');
            }
        } catch (error) {
            toast.error('เซิร์ฟเวอร์ขัดข้อง โปรดลองอีกครั้ง');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="p-4 md:p-8 max-w-5xl mx-auto">
            {/* ── Header Section ── */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-4">
                    <Link href="/admin/teachers" className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500">
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">เพิ่มคุณครูใหม่</h1>
                        <p className="text-sm text-gray-500 mt-1">เพิ่มข้อมูลส่วนตัวและประวัติการสอนสำหรับคุณครูท่านใหม่</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Link href="/admin/teachers" className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all shadow-sm">
                        ยกเลิก
                    </Link>
                    <button 
                        onClick={handleSubmit} 
                        disabled={isSubmitting || uploadingImage}
                        className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Save size={16} /> 
                        {uploadingImage ? 'กำลังอัปโหลดรูป...' : isSubmitting ? 'กำลังบันทึก...' : 'บันทึกคุณครูใหม่'}
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
                            <input type="file" accept="image/*" id="pfp" onChange={handleImageChange} className="hidden" disabled={uploadingImage} />
                            <div className="text-center">
                                <label htmlFor="pfp" className={`text-sm font-medium cursor-pointer ${uploadingImage ? 'text-gray-400' : 'text-blue-600 hover:text-blue-700'}`}>
                                    {uploadingImage ? 'กำลังอัปโหลด...' : 'อัปโหลดรูปภาพ'}
                                </label>
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