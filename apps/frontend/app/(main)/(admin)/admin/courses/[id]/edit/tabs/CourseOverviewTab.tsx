"use client";

import { useState, useEffect } from "react";
import { FileText, Video, User, Save, File, DollarSign } from "lucide-react";
import { courseApi, categoryApi, levelApi } from "@/app/lib/api";
import { useToast } from "@/app/components/ui/Toast";
import { SectionCard } from "@/app/components/ui/SectionCard";
import { NumberInput } from "@/app/components/ui/NumberInput";
import { RichTextarea } from "@/app/components/ui/RichTextarea";
import { ImageUpload } from "@/app/components/ui/ImageUpload";
import { Button } from "@/app/components/ui/Button";

interface CourseOverviewTabProps {
    course: any;
    instructors: any[];
    onUpdate: () => void;
}

export function CourseOverviewTab({ course, instructors, onUpdate }: CourseOverviewTabProps) {
    const { toast } = useToast();
    const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
    const [saving, setSaving] = useState(false);

    // ✅ รวมข้อมูลเดิมเข้ากับฟิลด์ใหม่ (วิดีโอ/ไฟล์) เพื่อให้บันทึกได้ครบ
    const [form, setForm] = useState<any>({
        title: course.title || "",
        description: course.description || "",
        price: course.price || 0,
        originalPrice: course.originalPrice || null,
        promotionalPrice: course.promotionalPrice || null,
        instructorId: course.instructorId || "",
        courseType: course.courseType || "ONLINE",
        demoVideoUrl: course.demoVideoUrl || "", 
        materialUrl: course.materialUrl || "",
        published: course.published ?? false,
        isBestSeller: course.isBestSeller ?? false,
        isRecommended: course.isRecommended ?? false,
    });

    // ✅ ฟังก์ชันดึง Token จาก LocalStorage
    const getToken = () => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('accessToken') || localStorage.getItem('token') || '';
        }
        return '';
    };

    const updateForm = (key: string, value: any) => {
        setForm((prev: any) => ({ ...prev, [key]: value }));
    };

    const handleSave = async () => {
        if (!form.title.trim()) {
            toast.error("กรุณากรอกชื่อคอร์ส");
            return;
        }

        setSaving(true);
        try {
            const token = getToken();
            
            // ✅ ใช้ fetch ยิงตรงไปที่ /api/courses/:id (ตามที่ระบุใน course.routes.ts)
            // บังคับใช้ Method PUT ตามหลังบ้าน
            const response = await fetch(`http://localhost:4000/api/courses/${course.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                credentials: 'include',
                body: JSON.stringify(form)
            });

            const res = await response.json();

            if (res.success) {
                // ถ้ามีการเปลี่ยนรูปหน้าปก ให้ใช้ courseApi เดิมช่วยอัปโหลด (เพราะมี ID แล้ว)
                if (thumbnailFile) {
                    await courseApi.uploadThumbnail(course.id, thumbnailFile);
                }
                toast.success("บันทึกการแก้ไขเรียบร้อยแล้ว ✨");
                onUpdate(); // รีเฟรชข้อมูลในหน้าหลัก
            } else {
                toast.error(res.error || "บันทึกไม่สำเร็จ");
            }
        } catch (error) {
            console.error("Update Error:", error);
            toast.error("เซสชันหมดอายุหรือการเชื่อมต่อมีปัญหา กรุณาล็อกอินใหม่");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
                
                {/* 1. ข้อมูลทั่วไป */}
                <SectionCard title="ข้อมูลทั่วไป" icon={FileText}>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">ชื่อคอร์ส *</label>
                            <input
                                type="text"
                                value={form.title}
                                onChange={(e) => updateForm("title", e.target.value)}
                                className="w-full h-10 px-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary/30 outline-none"
                            />
                        </div>
                        <RichTextarea
                            label="คำอธิบายคอร์ส"
                            value={form.description || ""}
                            onChange={(val) => updateForm("description", val)}
                        />
                    </div>
                </SectionCard>

                {/* 2. สื่อการสอน (เพิ่มช่องวิดีโอ/ไฟล์) */}
                <SectionCard title="สื่อการสอนและไฟล์ประกอบ" icon={Video}>
                    <div className="space-y-4">
                        <ImageUpload
                            label="ภาพปก (16:9)"
                            value={thumbnailFile || course.thumbnail}
                            onChange={setThumbnailFile}
                        />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">ลิงก์วิดีโอตัวอย่าง (MP4)</label>
                                <input
                                    type="url"
                                    value={form.demoVideoUrl}
                                    onChange={(e) => updateForm("demoVideoUrl", e.target.value)}
                                    placeholder="https://..."
                                    className="w-full h-10 px-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary/30 outline-none text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">ไฟล์เอกสารประกอบ (PDF)</label>
                                <input
                                    type="url"
                                    value={form.materialUrl}
                                    onChange={(e) => updateForm("materialUrl", e.target.value)}
                                    placeholder="https://..."
                                    className="w-full h-10 px-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary/30 outline-none text-sm"
                                />
                            </div>
                        </div>
                    </div>
                </SectionCard>

                {/* 3. ผู้สอน (เชื่อมกับฐานข้อมูลครู) */}
                <SectionCard title="ผู้สอน" icon={User}>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">เลือกผู้สอน</label>
                        <select
                            value={form.instructorId || ""}
                            onChange={(e) => updateForm("instructorId", e.target.value)}
                            className="w-full h-10 px-3 rounded-lg border border-gray-300 bg-white outline-none focus:ring-2 focus:ring-primary/30 text-sm"
                        >
                            <option value="">-- เลือกผู้สอน --</option>
                            {instructors.map((inst) => (
                                <option key={inst.id} value={inst.id}>
                                    {inst.name} {inst.nickname ? `(${inst.nickname})` : ''} - {inst.title || 'ครูผู้สอน'}
                                </option>
                            ))}
                        </select>
                    </div>
                </SectionCard>
            </div>

            {/* Sidebar ด้านขวา */}
            <div className="space-y-6">
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm sticky top-24 z-10">
                    <Button
                        onClick={handleSave}
                        isLoading={saving}
                        fullWidth
                        size="lg"
                    >
                        <Save size={18} className="mr-2" />
                        บันทึกการแก้ไข
                    </Button>
                    <p className="text-[10px] text-gray-400 mt-2 text-center italic">
                        * หากบันทึกไม่ได้ กรุณาล็อกเอาท์และล็อกอินใหม่
                    </p>
                </div>

                <SectionCard title="ราคา" icon={DollarSign}>
                    <div className="space-y-4">
                        <NumberInput
                            label="ราคาขาย (บาท) *"
                            value={form.price}
                            onChange={(val) => updateForm("price", val)}
                        />
                        <NumberInput
                            label="ราคาเต็ม (ขีดฆ่า)"
                            value={form.originalPrice || undefined}
                            onChange={(val) => updateForm("originalPrice", val || null)}
                        />
                    </div>
                </SectionCard>
            </div>
        </div>
    );
}