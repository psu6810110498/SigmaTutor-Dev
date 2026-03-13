"use client";

import { useState, useEffect, useMemo } from "react";
import { FileText, Video, User, Save, File, DollarSign, Folder } from "lucide-react";
import { courseApi, categoryApi, levelApi } from "@/app/lib/api";
import { useToast } from "@/app/components/ui/Toast";
import { SectionCard } from "@/app/components/ui/SectionCard";
import { NumberInput } from "@/app/components/ui/NumberInput";
import { RichTextarea } from "@/app/components/ui/RichTextarea";
import { ImageUpload } from "@/app/components/ui/ImageUpload";
import { Button } from "@/app/components/ui/Button";
import { useRouter } from "next/navigation";
import { InstructorMultiSelect, type SelectedInstructor, type InstructorOption } from "@/app/components/ui/InstructorMultiSelect";

interface CourseOverviewTabProps {
    course: any;
    instructors: InstructorOption[];
    onUpdate: () => void;
}

const QUICK_FILTERS = ["ทั้งหมด", "ประถม", "ม.ต้น", "ม.ปลาย", "TCAS", "SAT", "IELTS"];
const LEVEL_MAPPING: Record<string, string[]> = {
    'ประถม': ['ป.1', 'ป.2', 'ป.3', 'ป.4', 'ป.5', 'ป.6'],
    'ม.ต้น': ['ม.1', 'ม.2', 'ม.3'],
    'ม.ปลาย': ['ม.4', 'ม.5', 'ม.6'],
};

export function CourseOverviewTab({ course, instructors, onUpdate }: CourseOverviewTabProps) {
    const { toast } = useToast();
    const router = useRouter();
    const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
    const [newPdfFile, setNewPdfFile] = useState<File | null>(null);
    const [uploadingPdf, setUploadingPdf] = useState(false);
    const [uploadingGumlet, setUploadingGumlet] = useState(false);
    const [gumletProgress, setGumletProgress] = useState(0);
    const [saving, setSaving] = useState(false);

    // โหลด instructors ที่มีอยู่แล้วของคอร์ส (instructors[] จาก API หรือ fallback จาก instructorId)
    const [selectedInstructors, setSelectedInstructors] = useState<SelectedInstructor[]>(() => {
        if (Array.isArray(course.instructors) && course.instructors.length > 0) {
            return course.instructors.map((inst: any, idx: number) => ({
                id: inst.id,
                role: inst.role ?? (idx === 0 ? 'LEAD' : 'ASSISTANT'),
                order: inst.order ?? idx,
            }));
        }
        // backward compat: ถ้ายังไม่มี instructors[] ให้ใช้ instructorId เดิม
        if (course.instructorId) {
            return [{ id: course.instructorId, role: 'LEAD' as const, order: 0 }];
        }
        return [];
    });

    // ── ข้อมูลอ้างอิงจาก API ──
    const [categories, setCategories] = useState<any[]>([]);
    const [levels, setLevels] = useState<any[]>([]);

    useEffect(() => {
        categoryApi.list().then((r) => { if (r.success && r.data) setCategories(r.data); });
        levelApi.list().then((r) => { if (r.success && r.data) setLevels(r.data); });
    }, []);

    const [form, setForm] = useState<any>({
        title: course.title || "",
        description: course.description || "",
        price: course.price || 0,
        originalPrice: course.originalPrice || null,
        promotionalPrice: course.promotionalPrice || null,
        instructorId: course.instructorId || "",
        courseType: course.courseType || "ONLINE",
        categoryId: course.categoryId || null,
        levelId: course.levelId || null,
        demoVideoUrl: course.demoVideoUrl || "",
        gumletVideoId: course.gumletVideoId || "",
        videoProvider: course.videoProvider || "YOUTUBE",
        duration: course.duration || null,
        materialUrl: course.materialUrl || "",
        published: course.published ?? false,
        isBestSeller: course.isBestSeller ?? false,
        isRecommended: course.isRecommended ?? false,
        accessDurationDays: course.accessDurationDays ?? 365,
    });

    const rootCategories = useMemo(() => categories.filter(c => !c.parentId), [categories]);
    const [rootCategoryId, setRootCategoryId] = useState<string>("");
    const [activeQuickFilter, setActiveQuickFilter] = useState<string>("ทั้งหมด");

    // โหลดข้อมูลหมวดหมู่ตอนเริ่มต้น เพื่อเลือกแท็บที่ถูกต้อง
    useEffect(() => {
        if (categories.length > 0 && course.categoryId) {
            const currentCat = categories.find(c => c.id === course.categoryId);
            if (currentCat) {
                if (currentCat.parentId) {
                    setRootCategoryId(currentCat.parentId);
                    const parentCat = categories.find(c => c.id === currentCat.parentId);
                    if (parentCat) {
                        const filterName = QUICK_FILTERS.find(f => f === parentCat.name || parentCat.name.includes(f));
                        if (filterName) setActiveQuickFilter(filterName);
                    }
                } else {
                    setRootCategoryId(currentCat.id);
                    const filterName = QUICK_FILTERS.find(f => f === currentCat.name || currentCat.name.includes(f));
                    if (filterName) setActiveQuickFilter(filterName);
                }
            }
        }
    }, [categories, course.categoryId]);

    const childCategories = useMemo(() => {
        if (!rootCategoryId) return [];
        return categories.filter(c => c.parentId === rootCategoryId);
    }, [categories, rootCategoryId]);

    const levelOptions = useMemo(() => {
        const names = LEVEL_MAPPING[activeQuickFilter];
        if (!names) return [];
        return names.map(name => levels.find(l => l.name === name)).filter(Boolean);
    }, [activeQuickFilter, levels]);

    const showLevelDropdown = levelOptions.length > 0;

    const handleQuickFilter = (label: string) => {
        setActiveQuickFilter(label);
        setForm((prev: any) => ({ ...prev, levelId: null }));
        if (label === "ทั้งหมด") {
            setRootCategoryId("");
            setForm((prev: any) => ({ ...prev, categoryId: null }));
            return;
        }
        const found = rootCategories.find(c => c.name === label);
        if (found) {
            setRootCategoryId(found.id);
            setForm((prev: any) => ({ ...prev, categoryId: null }));
        }
    };

    const updateForm = (key: string, value: any) => {
        setForm((prev: any) => ({ ...prev, [key]: value }));
    };

    const parseDuration = (dStr: string | null) => {
        if (!dStr) return { d: '', h: '', m: '' };
        return {
            d: dStr.match(/(\d+)\s*วัน/)?.[1] || '',
            h: dStr.match(/(\d+)\s*(?:ชั่วโมง|ชม\.)/)?.[1] || '',
            m: dStr.match(/(\d+)\s*นาที/)?.[1] || ''
        };
    };

    const handleDurationChange = (type: 'd' | 'h' | 'm', val: string) => {
        const current = parseDuration(form.duration);
        current[type] = val;
        const parts = [];
        if (current.d && current.d !== '0') parts.push(`${current.d} วัน`);
        if (current.h && current.h !== '0') parts.push(`${current.h} ชั่วโมง`);
        if (current.m && current.m !== '0') parts.push(`${current.m} นาที`);
        updateForm('duration', parts.length > 0 ? parts.join(' ') : null);
    };

    const parsedDuration = parseDuration(form.duration);

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

    const handleGumletVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('video/')) {
            toast.error("กรุณาเลือกไฟล์วิดีโอเท่านั้น");
            return;
        }

        try {
            setUploadingGumlet(true);
            setGumletProgress(0);

            let token = localStorage.getItem('token') || localStorage.getItem('accessToken') || localStorage.getItem('adminToken');
            if (!token) {
                const match = document.cookie.match(/(?:^|;)\s*(token|accessToken)\s*=\s*([^;]+)/);
                if (match) token = match[2];
            }
            const headers: Record<string, string> = {};
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const res = await fetch('http://localhost:4000/api/gumlet/upload-url', {
                method: 'POST',
                credentials: 'include',
                headers
            });
            const data = await res.json();

            if (!data.success || !data.upload_url) {
                toast.error(data.error || "ไม่สามารถสร้างลิงก์อัปโหลดได้");
                setUploadingGumlet(false);
                return;
            }

            const { upload_url, asset_id } = data;

            return new Promise<void>((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                xhr.open('PUT', upload_url, true);
                xhr.setRequestHeader('Content-Type', file.type);

                xhr.upload.onprogress = (event) => {
                    if (event.lengthComputable) {
                        const percentComplete = Math.round((event.loaded / event.total) * 100);
                        setGumletProgress(percentComplete);
                    }
                };

                xhr.onload = () => {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        updateForm("gumletVideoId", asset_id);
                        toast.success("อัปโหลดวิดีโอสำเร็จ");
                        setUploadingGumlet(false);
                        resolve();
                    } else {
                        console.error('Upload failed with status', xhr.status, xhr.responseText);
                        toast.error("อัปโหลดไม่สำเร็จ หรือถูกยกเลิก");
                        setUploadingGumlet(false);
                        reject(new Error("Upload failed"));
                    }
                };

                xhr.onerror = () => {
                    console.error('XHR Upload Error');
                    toast.error("เกิดข้อผิดพลาดในการอัปโหลดวิดีโอ");
                    setUploadingGumlet(false);
                    reject(new Error("XHR Error"));
                };

                xhr.send(file);
            });
        } catch (error) {
            console.error(error);
            toast.error("ระบบอัปโหลดมีปัญหา");
            setUploadingGumlet(false);
        }
    };

    const handleSave = async () => {
        if (!form.title.trim()) {
            toast.error("กรุณากรอกชื่อคอร์ส");
            return;
        }

        // validate video URL is YouTube if provided
        if (form.videoProvider === 'YOUTUBE' && form.demoVideoUrl && !/^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\//i.test(form.demoVideoUrl)) {
            toast.error("กรุณากรอก URL Youtube ที่ถูกต้อง");
            return;
        }

        setSaving(true);
        try {

            // prepare and possibly upload new PDF if selected
            const payload: any = { ...form };
            // ส่ง instructorIds array ไปกับ payload
            payload.instructorIds = selectedInstructors
                .sort((a, b) => a.order - b.order)
                .map((s) => s.id);
            delete payload.instructorId;
            if (newPdfFile) {
                setUploadingPdf(true);
                try {
                    const formData = new FormData();
                    formData.append("file", newPdfFile);
                    let pdfToken = localStorage.getItem('token') || localStorage.getItem('accessToken') || localStorage.getItem('adminToken');
                    if (!pdfToken) {
                        const match = document.cookie.match(/(?:^|;)\s*(token|accessToken)\s*=\s*([^;]+)/);
                        if (match) pdfToken = match[2];
                    }
                    const pdfHeaders: Record<string, string> = {};
                    if (pdfToken) pdfHeaders['Authorization'] = `Bearer ${pdfToken}`;
                    const upRes = await fetch('http://localhost:4000/api/courses/upload/pdf', {
                        method: 'POST',
                        credentials: 'include',
                        headers: pdfHeaders,
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

            // จัดการเรื่องไอดีของระดับชั้นก่อนส่งเหมือนตอนสร้าง
            if (showLevelDropdown) {
                const found = levels.find(l => l.id === payload.levelId || l.name === payload.levelId);
                payload.levelId = found ? found.id : null;
            } else {
                const fallback = levels.find(l => l.name === 'ทั่วไป' || l.name === 'ไม่ระบุ') || levels[0];
                payload.levelId = fallback?.id || null;
            }

            // Cleanup empty strings
            ['demoVideoUrl', 'gumletVideoId', 'materialUrl'].forEach((key) => {
                if (payload[key as keyof typeof payload] === "") payload[key as keyof typeof payload] = null;
            });

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
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">ผู้ให้บริการวิดีโอตัวอย่าง</label>
                                <select
                                    value={form.videoProvider}
                                    onChange={(e) => updateForm("videoProvider", e.target.value)}
                                    className="w-full h-10 px-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary/30 outline-none text-sm"
                                >
                                    <option value="YOUTUBE">YouTube</option>
                                    <option value="GUMLET">Gumlet</option>
                                </select>
                            </div>

                            {form.videoProvider === 'GUMLET' ? (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">วิดีโอตัวอย่าง (Gumlet Video ID)</label>
                                    <div className="relative flex items-center gap-2">
                                        <div className="relative flex-1">
                                            <Video className={`absolute left-3 top-1/2 -translate-y-1/2 ${form.gumletVideoId ? 'text-green-500' : 'text-gray-400'}`} size={16} />
                                            <input
                                                type="text"
                                                value={form.gumletVideoId || ""}
                                                onChange={(e) => updateForm("gumletVideoId", e.target.value)}
                                                className={`w-full h-10 px-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary/30 outline-none text-sm pl-10 pr-20 ${form.gumletVideoId && form.gumletVideoId.length > 5 ? 'border-green-300 bg-green-50/30 text-green-800' : 'bg-white'}`}
                                                placeholder="กรอก Video ID หรืออัปโหลดไฟล์..."
                                                disabled={uploadingGumlet}
                                            />
                                            {form.gumletVideoId && !uploadingGumlet && (
                                                <button type="button" onClick={() => updateForm("gumletVideoId", "")} className="absolute right-12 top-1/2 -translate-y-1/2 text-red-400 hover:text-red-500">
                                                    ✗
                                                </button>
                                            )}
                                        </div>
                                        <div className="absolute right-1 top-1/2 -translate-y-1/2 flex z-10">
                                            <input
                                                type="file"
                                                accept="video/mp4,video/x-m4v,video/*"
                                                onChange={handleGumletVideoUpload}
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                                                disabled={uploadingGumlet}
                                                title="อัปโหลดวิดีโอใหม่"
                                            />
                                            <button
                                                type="button"
                                                disabled={uploadingGumlet}
                                                className={`h-8 px-2 rounded-md text-xs font-medium transition-colors flex items-center justify-center ${
                                                    uploadingGumlet
                                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                        : 'bg-primary/10 text-primary hover:bg-primary/20'
                                                }`}
                                            >
                                                {uploadingGumlet ? (
                                                    <span className="flex items-center gap-1">
                                                        <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                        </svg>
                                                        {gumletProgress}%
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center gap-1">
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
                                                        อัปโหลด
                                                    </span>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">ลิงก์วิดีโอตัวอย่าง (YouTube / MP4)</label>
                                    <input
                                        type="url"
                                        value={form.demoVideoUrl || ""}
                                        onChange={(e) => updateForm("demoVideoUrl", e.target.value)}
                                        placeholder="https://www.youtube.com/watch?v=..."
                                        className="w-full h-10 px-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary/30 outline-none text-sm"
                                    />
                                </div>
                            )}

                            <div className="md:col-span-2">
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
                    <div className="pt-4 border-t border-gray-100">
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">อายุการเข้าถึงคอร์ส (วัน) <span className="text-xs text-gray-400 font-normal">— ตั้งค่า admin เท่านั้น</span></label>
                        <div className="flex items-center gap-2">
                            <input
                                type="number"
                                min="1"
                                value={form.accessDurationDays ?? 365}
                                onChange={(e) => updateForm("accessDurationDays", parseInt(e.target.value) || 365)}
                                className="w-32 h-10 px-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary/30 outline-none text-sm text-center"
                            />
                            <span className="text-sm text-gray-500">วัน (ค่าเริ่มต้น 365 วัน = 1 ปี)</span>
                        </div>
                    </div>
                </SectionCard>

                {/* 3. หมวดหมู่และระดับชั้น */}
                <SectionCard title="หมวดหมู่และระดับชั้น" icon={Folder}>
                    <div className="flex flex-wrap gap-2 mb-4">
                        {QUICK_FILTERS.map(f => (
                            <button
                                key={f}
                                type="button"
                                onClick={() => handleQuickFilter(f)}
                                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${activeQuickFilter === f ? 'bg-secondary text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                    {rootCategoryId && childCategories.length > 0 && (
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">เลือกวิชา *</label>
                            <select
                                value={form.categoryId || ""}
                                onChange={(e) => updateForm("categoryId", e.target.value)}
                                className="w-full h-10 px-3 rounded-lg border border-gray-300 bg-white text-sm focus:ring-2 focus:ring-primary/30 outline-none transition-all"
                            >
                                <option value="" disabled>-- เลือกวิชา --</option>
                                {childCategories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                    )}
                    {showLevelDropdown && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">ระดับชั้น</label>
                            <select
                                value={form.levelId || ""}
                                onChange={(e) => updateForm("levelId", e.target.value)}
                                className="w-full h-10 px-3 rounded-lg border border-gray-300 bg-white text-sm focus:ring-2 focus:ring-primary/30 outline-none transition-all"
                            >
                                <option value="">-- เลือกระดับชั้น --</option>
                                {levelOptions.map((l: any) => <option key={l.id} value={l.id}>{l.name}</option>)}
                            </select>
                        </div>
                    )}
                </SectionCard>

                {/* 4. ผู้สอน (รองรับหลายคน) */}
                <SectionCard title="ผู้สอน" icon={User}>
                    <InstructorMultiSelect
                        options={instructors}
                        value={selectedInstructors}
                        onChange={setSelectedInstructors}
                    />
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
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">ระยะเวลาเรียน</label>
                            <div className="grid grid-cols-3 gap-2">
                                <div>
                                    <div className="flex items-center gap-1 border border-gray-300 rounded-lg px-2 bg-white focus-within:ring-2 focus-within:ring-primary/30">
                                        <input type="number" min="0" value={parsedDuration.d} onChange={(e) => handleDurationChange('d', e.target.value)} className="w-full h-10 outline-none text-sm bg-transparent text-center" placeholder="0" />
                                        <span className="text-sm text-gray-500 whitespace-nowrap">วัน</span>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex items-center gap-1 border border-gray-300 rounded-lg px-2 bg-white focus-within:ring-2 focus-within:ring-primary/30">
                                        <input type="number" min="0" value={parsedDuration.h} onChange={(e) => handleDurationChange('h', e.target.value)} className="w-full h-10 outline-none text-sm bg-transparent text-center" placeholder="0" />
                                        <span className="text-sm text-gray-500 whitespace-nowrap">ชม.</span>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex items-center gap-1 border border-gray-300 rounded-lg px-2 bg-white focus-within:ring-2 focus-within:ring-primary/30">
                                        <input type="number" min="0" value={parsedDuration.m} onChange={(e) => handleDurationChange('m', e.target.value)} className="w-full h-10 outline-none text-sm bg-transparent text-center" placeholder="0" />
                                        <span className="text-sm text-gray-500 whitespace-nowrap">นาที</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </SectionCard>
            </div>
        </div>
    );
}