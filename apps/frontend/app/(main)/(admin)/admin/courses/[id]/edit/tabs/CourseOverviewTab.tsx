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
import { useRouter } from "next/navigation";

interface CourseOverviewTabProps {
    course: any;
    instructors: any[];
    onUpdate: () => void;
}

export function CourseOverviewTab({ course, instructors, onUpdate }: CourseOverviewTabProps) {
    const { toast } = useToast();
    const router = useRouter();
    const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
    const [newPdfFile, setNewPdfFile] = useState<File | null>(null);
    const [uploadingPdf, setUploadingPdf] = useState(false);
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


    const updateForm = (key: string, value: any) => {
        setForm((prev: any) => ({ ...prev, [key]: value }));
    };

    const handlePdfSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.type !== "application/pdf") {
            toast.error("กรุณาอัปโหลดไฟล์ PDF เท่านั้น");
            return;
        }
        setNewPdfFile(file);
        // clear any manual URL when a file is chosen
        updateForm("materialUrl", "");
    };

    const handleSave = async () => {
        if (!form.title.trim()) {
            toast.error("กรุณากรอกชื่อคอร์ส");
            return;
        }

        // validate video URL is YouTube if provided
        if (form.demoVideoUrl && !/^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\//i.test(form.demoVideoUrl)) {
            toast.error("กรุณากรอก URL Youtube ที่ถูกต้อง");
            return;
        }

        setSaving(true);
        try {

            // prepare and possibly upload new PDF if selected
            const payload = { ...form };
            if (newPdfFile) {
                setUploadingPdf(true);
                try {
                    const formData = new FormData();
                    formData.append("file", newPdfFile);
                    const upRes = await fetch('http://localhost:4000/api/courses/upload/pdf', {
                        method: 'POST',
                        credentials: 'include',
                        body: formData
                    });
                    const upData = await upRes.json();
                    if (upRes.ok && upData.url) {
                        payload.materialUrl = upData.url;
                        console.log("Uploaded PDF URL:", upData.url);
                    } else {
                        toast.error(upData.error || "อัปโหลดเอกสารไม่สำเร็จ");
                    }
                } catch (err) {
                    console.error("PDF upload error", err);
                    toast.error("ไม่สามารถอัปโหลดไฟล์ได้");
                } finally {
                    setUploadingPdf(false);
                }
            }

            console.log("FINAL PAYLOAD TO BACKEND:", payload);
            // ✅ ใช้ fetch ยิงตรงไปที่ /api/courses/:id (ตามที่ระบุใน course.routes.ts)
            // บังคับใช้ Method PUT ตามหลังบ้าน
            const response = await fetch(`http://localhost:4000/api/courses/${course.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify(payload)
            });

            const res = await response.json();

            if (res.success) {
                // ถ้ามีการเปลี่ยนรูปหน้าปก ให้ใช้ courseApi เดิมช่วยอัปโหลด (เพราะมี ID แล้ว)
                if (thumbnailFile) {
                    await courseApi.uploadThumbnail(course.id, thumbnailFile);
                }
                toast.success("บันทึกการแก้ไขเรียบร้อยแล้ว ✨");
                onUpdate(); // รีเฟรชข้อมูลในหน้าหลัก
                router.refresh(); // clear Next.js cache so UI shows updated data
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
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">ลิงก์วิดีโอแนะนำคอร์ส (YouTube)</label>
                                <input
                                    type="url"
                                    value={form.demoVideoUrl || ""}
                                    onChange={(e) => updateForm("demoVideoUrl", e.target.value)}
                                    placeholder="https://www.youtube.com/watch?v=..."
                                    className="w-full h-10 px-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary/30 outline-none text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">ไฟล์เอกสารประกอบ (PDF)</label>
                                {/* show existing document link when not overriding with a new file */}
                                {form.materialUrl && !newPdfFile && (
                                    <p className="text-xs text-blue-600 underline mb-2">
                                        <a href={form.materialUrl} target="_blank" rel="noopener noreferrer">
                                            📄 ดูไฟล์เอกสารปัจจุบัน
                                        </a>
                                    </p>
                                )}
                                <div className="relative flex items-center gap-2">
                                    <div className="relative flex-1">
                                        <File className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                        <input
                                            type="url"
                                            value={form.materialUrl || ""}
                                            onChange={(e) => updateForm("materialUrl", e.target.value)}
                                            placeholder="https://..."
                                            className="w-full h-10 px-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary/30 outline-none text-sm pl-10"
                                            disabled={!!newPdfFile || uploadingPdf}
                                        />
                                    </div>
                                    <div className="relative shrink-0 flex">
                                        <input
                                            type="file"
                                            accept="application/pdf"
                                            onChange={handlePdfSelect}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                            disabled={uploadingPdf}
                                            title="คลิกเพื่อเลือกไฟล์ PDF"
                                        />
                                        <button
                                            type="button"
                                            disabled={uploadingPdf}
                                            className={`h-10 px-4 rounded-lg border text-sm font-medium transition-colors flex items-center justify-center w-full sm:w-auto
                                                ${uploadingPdf
                                                    ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                                                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                                        >
                                            {uploadingPdf ? (
                                                <span className="flex items-center gap-2">
                                                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                    </svg>
                                                    กำลังอัปโหลด...
                                                </span>
                                            ) : (
                                                newPdfFile ? newPdfFile.name : 'เลือกไฟล์ PDF'
                                            )}
                                        </button>
                                    </div>
                                </div>
                                {newPdfFile && (
                                    <p className="text-xs text-gray-600 mt-1">ไฟล์ที่เลือก: {newPdfFile.name}</p>
                                )}
                                <p className="text-xs text-gray-400 mt-1.5">รองรับไฟล์ .pdf ขนาดไม่เกิน 10MB</p>
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