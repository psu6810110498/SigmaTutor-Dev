"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link'; // ✅ เพิ่ม Link
import { 
    ChevronLeft, Save, User, 
    BookOpen, GraduationCap, Briefcase, Star, Globe
} from 'lucide-react';
import { useToast } from "@/app/components/ui/Toast";
import { ImageUpload } from "@/app/components/ui/ImageUpload";

export default function CreateTeacherPage() {
    const router = useRouter();
    const { toast } = useToast();
    
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [imageFile, setImageFile] = useState<File | null>(null);

    const [formData, setFormData] = useState({ 
        name: '', nickname: '', title: '', bio: '', 
        profileImage: '', expertise: '', education: '', 
        experience: '', socialLink: ''    
    });

    const getToken = () => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('accessToken') || localStorage.getItem('token') || '';
        }
        return '';
    };

    const handleImageChange = async (file: File | null) => {
        setImageFile(file);
        if (!file) return;

        setUploadingImage(true);
        try {
            const uploadData = new FormData();
            uploadData.append("file", file);
            const token = getToken();
            const res = await fetch('http://localhost:4000/api/courses/upload/pdf', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                credentials: 'include',
                body: uploadData
            });
            const data = await res.json();
            if (data.success) {
                setFormData(prev => ({ ...prev, profileImage: data.url }));
                toast.success("อัปโหลดรูปภาพโปรไฟล์เรียบร้อย");
            }
        } catch (error) {
            toast.error("อัปโหลดรูปภาพล้มเหลว");
        } finally {
            setUploadingImage(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const token = getToken();
            const res = await fetch('http://localhost:4000/api/users/instructors', {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${token}`, 
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify(formData)
            });
            const data = await res.json();
            if (data.success) {
                toast.success('บันทึกโปรไฟล์คุณครูเรียบร้อยแล้ว');
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
        <div className="min-h-screen bg-gray-50/50 pb-20">
            {/* ── Sticky Header ── */}
            <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-200">
                <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
                    <Link 
                        href="/admin/teachers" 
                        className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors font-medium text-sm"
                    >
                        <ChevronLeft size={20} /> ย้อนกลับไปหน้าจัดการคุณครู
                    </Link>
                    <button 
                        type="submit" 
                        form="teacher-form"
                        disabled={isSubmitting || uploadingImage}
                        className="flex items-center gap-2 px-6 py-2 bg-primary text-white rounded-full font-bold text-sm hover:bg-primary-dark transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
                    >
                        <Save size={18} /> {isSubmitting ? 'กำลังบันทึก...' : 'บันทึกโปรไฟล์'}
                    </button>
                </div>
            </div>

            <main className="max-w-5xl mx-auto px-4 pt-10">
                <form id="teacher-form" onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* ส่วนแสดงพรีวิวภาพทางซ้าย */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-white rounded-3xl p-8 border border-gray-200 shadow-sm text-center">
                            <ImageUpload label="" value={imageFile} onChange={handleImageChange} />
                            <h3 className="text-lg font-bold text-gray-900 mt-4">{formData.name || 'ชื่อคุณครู'}</h3>
                            <p className="text-sm text-primary font-medium">{formData.title || 'ตำแหน่งวิชาการ'}</p>
                        </div>
                    </div>

                    {/* ส่วนฟอร์มทางขวา */}
                    <div className="lg:col-span-2 space-y-6">
                        <section className="bg-white rounded-3xl p-8 border border-gray-200 shadow-sm space-y-6">
                            <h2 className="text-lg font-bold text-gray-900">ข้อมูลพื้นฐาน</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="ชื่อ-นามสกุล *" className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl outline-none text-sm" />
                                <input type="text" value={formData.nickname} onChange={e => setFormData({...formData, nickname: e.target.value})} placeholder="ชื่อเล่น" className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl outline-none text-sm" />
                            </div>
                            <input type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="ตำแหน่ง / สโลแกน" className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl outline-none text-sm" />
                        </section>

                        <section className="bg-white rounded-3xl p-8 border border-gray-200 shadow-sm space-y-6">
                            <h2 className="text-lg font-bold text-gray-900">ประวัติวิชาการ</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <input type="text" value={formData.expertise} onChange={e => setFormData({...formData, expertise: e.target.value})} placeholder="ความเชี่ยวชาญ" className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl outline-none text-sm" />
                                <input type="text" value={formData.education} onChange={e => setFormData({...formData, education: e.target.value})} placeholder="วุฒิการศึกษา" className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl outline-none text-sm" />
                            </div>
                        </section>

                        <section className="bg-white rounded-3xl p-8 border border-gray-200 shadow-sm space-y-6">
                            <h2 className="text-lg font-bold text-gray-900">แนะนำตัว (Bio)</h2>
                            <textarea rows={4} value={formData.bio} onChange={e => setFormData({...formData, bio: e.target.value})} placeholder="เล่าเรื่องราวของคุณ..." className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl outline-none text-sm resize-none" />
                        </section>
                    </div>
                </form>
            </main>
        </div>
    );
}