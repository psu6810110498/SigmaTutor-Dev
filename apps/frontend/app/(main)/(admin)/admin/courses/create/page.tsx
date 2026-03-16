"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
    FileText, Video, Folder, Globe, MapPin, Users, Monitor,
    Save, ChevronLeft, Tag, User, Award, Sparkles, BookOpen, CalendarDays, File,
    LayoutDashboard, Calendar, CheckCircle2
} from "lucide-react";
import { courseApi, categoryApi, levelApi, userApi } from "@/app/lib/api";
import type { Category, Level, CreateCourseInput } from "@/app/lib/types";
import { useToast } from "@/app/components/ui/Toast";
import { AdminFormLayout } from "@/app/components/layouts/AdminFormLayout";
import { SectionCard } from "@/app/components/ui/SectionCard";
import { NumberInput } from "@/app/components/ui/NumberInput";
import { RichTextarea } from "@/app/components/ui/RichTextarea";
import { ImageUpload } from "@/app/components/ui/ImageUpload";
import { Button } from "@/app/components/ui/Button";
import { InstructorMultiSelect, type SelectedInstructor, type InstructorOption } from "@/app/components/ui/InstructorMultiSelect";
import { LessonsTab } from "../[id]/edit/tabs/LessonsTab";
import { LiveScheduleTab } from "../[id]/edit/tabs/LiveScheduleTab";
import { OnsiteScheduleTab } from "../[id]/edit/tabs/OnsiteScheduleTab";

const DRAFT_KEY = "draft_course_create";
const QUICK_FILTERS = ["ทั้งหมด", "ประถม", "ม.ต้น", "ม.ปลาย", "TCAS", "SAT", "IELTS"];
const LEVEL_MAPPING: Record<string, string[]> = {
    'ประถม': ['ป.1', 'ป.2', 'ป.3', 'ป.4', 'ป.5', 'ป.6'],
    'ม.ต้น': ['ม.1', 'ม.2', 'ม.3'],
    'ม.ปลาย': ['ม.4', 'ม.5', 'ม.6'],
};

export default function CreateCoursePage() {
    const router = useRouter();
    const { toast } = useToast();

    const [activeTab, setActiveTab] = useState<"overview" | "content">("overview");
    const [createdCourseId, setCreatedCourseId] = useState<string | null>(null);

    const [categories, setCategories] = useState<Category[]>([]);
    const [levels, setLevels] = useState<Level[]>([]);
    const [instructors, setInstructors] = useState<InstructorOption[]>([]);
    const [selectedInstructors, setSelectedInstructors] = useState<SelectedInstructor[]>([]);

    useEffect(() => {
        categoryApi.list().then((r) => { if (r.success && r.data) setCategories(r.data); });
        levelApi.list().then((r) => { if (r.success && r.data) setLevels(r.data); });
        const fetchInstructors = async () => {
            try {
                const res = await userApi.list();
                if (res.success && res.data) {
                    const options: InstructorOption[] = res.data.map((t: any) => ({
                        id: t.id, name: t.name, profileImage: t.profileImage || undefined,
                    }));
                    setInstructors(options);
                }
            } catch (error) { console.error("Failed to fetch instructors:", error); }
        };
        fetchInstructors();
    }, []);

    const rootCategories = useMemo(() => categories.filter(c => !c.parentId), [categories]);
    const [rootCategoryId, setRootCategoryId] = useState<string>("");
    const [activeQuickFilter, setActiveQuickFilter] = useState<string>("ทั้งหมด");

    const childCategories = useMemo(() => {
        if (!rootCategoryId) return [];
        return categories.filter(c => c.parentId === rootCategoryId);
    }, [categories, rootCategoryId]);

    const levelOptions = useMemo(() => {
        const names = LEVEL_MAPPING[activeQuickFilter];
        if (!names) return [];
        return names.map(name => levels.find(l => l.name === name)).filter(Boolean) as Level[];
    }, [activeQuickFilter, levels]);

    const showLevelDropdown = levelOptions.length > 0;

    // ── Form State ──
    const [form, setForm] = useState<any>({
        title: "",
        courseCode: "",
        shortDescription: "",
        description: "",
        price: 0,
        originalPrice: null,
        promotionalPrice: null,
        courseType: "ONLINE",
        categoryId: null,
        levelId: null,
        instructorId: undefined,
        duration: null,
        videoCount: 0,
        maxSeats: null,
        enrollStartDate: null,
        enrollEndDate: null,
        location: null,
        mapUrl: null,
        zoomLink: null,
        meetingId: null,
        priceRange: null,
        demoVideoUrl: "",
        gumletVideoId: "",
        videoProvider: "YOUTUBE",
        materialUrl: "",
        published: false,
        tags: [],
        isBestSeller: false,
        isRecommended: false,
        accessDurationDays: 365,
    });

    const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
    const [saving, setSaving] = useState(false);
    const [uploadingPdf, setUploadingPdf] = useState(false);
    const [uploadingGumlet, setUploadingGumlet] = useState(false);
    const [gumletProgress, setGumletProgress] = useState(0);

    useEffect(() => {
        if (createdCourseId) return;
        const saved = localStorage.getItem(DRAFT_KEY);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (parsed.form) setForm((prev: any) => ({ ...prev, ...parsed.form }));
                if (parsed.rootCategoryId) setRootCategoryId(parsed.rootCategoryId);
                if (parsed.activeQuickFilter) setActiveQuickFilter(parsed.activeQuickFilter);
            } catch (e) { console.error("Failed to parse draft", e); }
        }
    }, []);

    useEffect(() => {
        if (createdCourseId) return;
        const timer = setTimeout(() => {
            localStorage.setItem(DRAFT_KEY, JSON.stringify({ form, rootCategoryId, activeQuickFilter }));
        }, 1000);
        return () => clearTimeout(timer);
    }, [form, rootCategoryId, activeQuickFilter, createdCourseId]);

    useEffect(() => {
        if (categories.length === 0 && levels.length === 0) return;
        let changed = false;
        const updates: any = {};
        if (form.categoryId && !categories.some((c) => c.id === form.categoryId)) { updates.categoryId = null; changed = true; }
        if (form.levelId && !levels.some((l) => l.id === form.levelId)) { updates.levelId = null; changed = true; }
        if (rootCategoryId && !categories.some((c) => c.id === rootCategoryId)) { setRootCategoryId(""); changed = true; }
        if (changed) setForm((prev: any) => ({ ...prev, ...updates }));
    }, [categories, levels]);

    const updateForm = (key: string, value: any) => setForm((prev: any) => ({ ...prev, [key]: value }));

    const parseDuration = (dStr: string | null) => {
        if (!dStr) return { d: '', h: '', m: '' };
        return {
            d: dStr.match(/(\d+)\s*วัน/)?.[1] || '',
            h: dStr.match(/(\d+)\s*(?:ชั่วโมง|ชม\.)/)?.[1] || '',
            m: dStr.match(/(\d+)\s*นาที/)?.[1] || ''
        };
    };

    const handleDurationChange = (type: 'd' | 'h' | 'm', val: string) => {
        const current = parseDuration(form.duration || null);
        current[type] = val;
        const parts = [];
        if (current.d && current.d !== '0') parts.push(`${current.d} วัน`);
        if (current.h && current.h !== '0') parts.push(`${current.h} ชั่วโมง`);
        if (current.m && current.m !== '0') parts.push(`${current.m} นาที`);
        updateForm('duration', parts.length > 0 ? parts.join(' ') : null);
    };

    const parsedDuration = parseDuration(form.duration || null);

    const handleQuickFilter = (label: string) => {
        setActiveQuickFilter(label);
        updateForm("levelId", null);
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

    const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || file.type !== "application/pdf") { toast.error("เลือกไฟล์ PDF เท่านั้น"); return; }
        setUploadingPdf(true);
        const formData = new FormData();
        formData.append("file", file);
        try {
            const res = await fetch('http://localhost:4000/api/courses/upload/pdf', { method: 'POST', credentials: 'include', body: formData });
            const data = await res.json();
            if (data.url) { updateForm("materialUrl", data.url); toast.success("อัปโหลด PDF สำเร็จ"); }
            else toast.error(data.error || "อัปโหลดไฟล์ไม่สำเร็จ");
        } catch (error) { console.error(error); toast.error("เกิดข้อผิดพลาดในการอัปโหลด"); }
        finally { setUploadingPdf(false); }
    };

    const handleGumletVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !file.type.startsWith('video/')) { toast.error("กรุณาเลือกไฟล์วิดีโอเท่านั้น"); return; }
        try {
            setUploadingGumlet(true); setGumletProgress(0);
            const res = await fetch('http://localhost:4000/api/gumlet/upload-url', { method: 'POST', credentials: 'include' });
            const data = await res.json();
            if (!data.success || !data.upload_url) { toast.error(data.error || "ไม่สามารถสร้างลิงก์อัปโหลดได้"); setUploadingGumlet(false); return; }
            const { upload_url, asset_id } = data;
            return new Promise<void>((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                xhr.open('PUT', upload_url, true);
                xhr.setRequestHeader('Content-Type', file.type);
                xhr.upload.onprogress = (event) => { if (event.lengthComputable) setGumletProgress(Math.round((event.loaded / event.total) * 100)); };
                xhr.onload = () => {
                    if (xhr.status >= 200 && xhr.status < 300) { updateForm("gumletVideoId", asset_id); toast.success("อัปโหลดวิดีโอสำเร็จ"); setUploadingGumlet(false); resolve(); }
                    else { toast.error("อัปโหลดไม่สำเร็จ"); setUploadingGumlet(false); reject(new Error("Upload failed")); }
                };
                xhr.onerror = () => { toast.error("เกิดข้อผิดพลาดในการอัปโหลด"); setUploadingGumlet(false); reject(new Error("XHR Error")); };
                xhr.send(file);
            });
        } catch (error) { console.error(error); toast.error("ระบบอัปโหลดมีปัญหา"); setUploadingGumlet(false); }
    };

    const handleSubmit = async () => {
        setSaving(true);
        if (!form.title?.trim() || selectedInstructors.length === 0) {
            toast.error("กรุณากรอกชื่อคอร์สและเลือกผู้สอนอย่างน้อย 1 คน");
            setSaving(false); return;
        }
        if ((form.courseType === "ONLINE_LIVE" || form.courseType === "ONSITE") && (!form.maxSeats || form.maxSeats < 1)) {
            toast.error("กรุณาระบุจำนวนที่นั่งสำหรับคอร์สประเภทนี้");
            setSaving(false); return;
        }

        const payload: any = { ...form };
        // ถ้าเป็น ONLINE ให้ maxSeats เป็น null เสมอ
        if (payload.courseType === "ONLINE") payload.maxSeats = null;

        payload.instructorIds = selectedInstructors.sort((a, b) => a.order - b.order).map((s) => s.id);
        delete payload.instructorId;

        // แปลง date strings → ISO string หรือ null
        ['enrollStartDate', 'enrollEndDate'].forEach(key => {
            if (payload[key]) { try { payload[key] = new Date(payload[key]).toISOString(); } catch { payload[key] = null; } }
            else payload[key] = null;
        });

        // แปลง empty string → null สำหรับ optional fields ทั้งหมด
        // (ป้องกัน Zod url() / string() validation ล้มเหลว)
        [
            'demoVideoUrl', 'gumletVideoId', 'location', 'materialUrl',
            'mapUrl', 'zoomLink', 'meetingId', 'courseCode', 'duration',
            'priceRange', 'shortDescription',
        ].forEach((key) => {
            if (payload[key] === "") payload[key] = null;
        });

        payload.description = payload.description || "";
        // shortDescription ต้องไม่ส่ง empty string ให้ Zod
        if (!payload.shortDescription) payload.shortDescription = null;

        if (showLevelDropdown) {
            const found = levels.find(l => l.id === payload.levelId || l.name === payload.levelId);
            payload.levelId = found ? found.id : null;
        } else {
            const fallback = levels.find(l => l.name === 'ทั่วไป' || l.name === 'ไม่ระบุ') || levels[0];
            payload.levelId = fallback?.id || null;
        }

        try {
            const response = await fetch('http://localhost:4000/api/courses', {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(payload)
            });
            const res = await response.json();
            if (res.success) {
                const newId = res.data.id;
                if (thumbnailFile) await courseApi.uploadThumbnail(newId, thumbnailFile);
                localStorage.removeItem(DRAFT_KEY);
                setCreatedCourseId(newId);
                toast.success("สร้างคอร์สสำเร็จ! เพิ่มบทเรียนได้เลย");
                setActiveTab("content");
            } else {
                // แสดง field ที่ error จาก Zod details
                if (res.details && res.details.length > 0) {
                    const firstError = res.details[0];
                    toast.error(`${res.error}: [${firstError.field}] ${firstError.message}`);
                } else {
                    toast.error(res.error || "สร้างคอร์สไม่สำเร็จ");
                }
            }
        } catch (error) {
            toast.error("เกิดข้อผิดพลาดในการเชื่อมต่อ");
        } finally {
            setSaving(false);
        }

    };

    const completeness = useMemo(() => {
        let filled = 0;
        if (form.title?.trim()) filled++;
        if (form.description) filled++;
        if ((form.price ?? 0) > 0) filled++;
        if (selectedInstructors.length > 0) filled++;
        if (thumbnailFile) filled++;
        return Math.round((filled / 5) * 100);
    }, [form, selectedInstructors, thumbnailFile]);

    const inputClass = "w-full h-10 px-3 rounded-lg border border-gray-300 bg-white text-sm focus:ring-2 focus:ring-primary/30 outline-none transition-all";
    const labelClass = "block text-sm font-medium text-gray-700 mb-1.5";
    const fakeCourse = createdCourseId ? { ...form, id: createdCourseId } : null;

    return (
        <AdminFormLayout
            title={createdCourseId ? `แก้ไข: ${form.title}` : "สร้างคอร์สใหม่"}
            description={createdCourseId ? "จัดการบทเรียนหรือตารางเรียน" : "กรอกข้อมูลคอร์สเพื่อเริ่มสอน"}
            breadcrumbs={[
                { label: 'แดชบอร์ด', href: '/admin' },
                { label: 'จัดการคอร์ส', href: '/admin/courses' },
                { label: 'สร้างคอร์สใหม่', href: '#' }
            ]}
            actions={
                activeTab === "overview" ? (
                    <>
                        <Link href="/admin/courses"><Button variant="ghost">ยกเลิก</Button></Link>
                        {!createdCourseId ? (
                            <Button onClick={handleSubmit} isLoading={saving}>
                                <Save size={18} className="mr-2" /> บันทึกและไปต่อ
                            </Button>
                        ) : (
                            <Button onClick={() => setActiveTab("content")}>
                                <CheckCircle2 size={18} className="mr-2" /> ไปจัดการบทเรียน
                            </Button>
                        )}
                    </>
                ) : (
                    <>
                        <Button variant="ghost" onClick={() => setActiveTab("overview")}>
                            <ChevronLeft size={18} className="mr-1" /> ข้อมูลทั่วไป
                        </Button>
                        <Link href="/admin/courses">
                            <Button variant="outline">
                                <CheckCircle2 size={18} className="mr-2" /> เสร็จสิ้น
                            </Button>
                        </Link>
                    </>
                )
            }
        >
            <div className="flex border-b border-gray-200 mb-6 overflow-x-auto">
                <TabButton active={activeTab === "overview"} onClick={() => setActiveTab("overview")} icon={LayoutDashboard} label="ข้อมูลทั่วไป" />
                <TabButton
                    active={activeTab === "content"}
                    onClick={() => createdCourseId ? setActiveTab("content") : undefined}
                    icon={form.courseType === "ONLINE" ? BookOpen : Calendar}
                    label={form.courseType === "ONLINE" ? "เนื้อหาบทเรียน" : "ตารางเรียน"}
                    disabled={!createdCourseId}
                />
            </div>

            <div className="animate-fade-in-up">
                {activeTab === "overview" && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 space-y-6">
                            <SectionCard title="ข้อมูลทั่วไป" icon={FileText}>
                                <div className="space-y-4">
                                    <div>
                                        <label className={labelClass}>ชื่อคอร์ส <span className="text-red-500">*</span></label>
                                        <input type="text" value={form.title} onChange={(e) => updateForm("title", e.target.value)} placeholder="เช่น ฟิสิกส์ A-Level ฉบับแม่นยำ" className={inputClass} />
                                    </div>
                                    <div>
                                        <label className={labelClass}>รหัสคอร์ส</label>
                                        <input type="text" value={form.courseCode || ""} onChange={(e) => updateForm("courseCode", e.target.value)} placeholder="เช่น PHYS-A001" className={inputClass} />
                                    </div>
                                    <div>
                                        <div className="flex items-center justify-between mb-1">
                                            <label className={labelClass}>คำอธิบายสั้นๆ (แสดงบน Card) <span className="text-red-500">*</span></label>
                                            <span className={`text-xs font-medium tabular-nums ${(form.shortDescription?.length ?? 0) === 0 ? 'text-gray-400' : (form.shortDescription?.length ?? 0) >= 50 && (form.shortDescription?.length ?? 0) <= 120 ? 'text-green-600' : (form.shortDescription?.length ?? 0) > 180 ? 'text-red-500' : 'text-amber-500'}`}>
                                                {form.shortDescription?.length ?? 0} / 120
                                            </span>
                                        </div>
                                        <textarea value={form.shortDescription || ""} onChange={(e) => updateForm("shortDescription", e.target.value)} placeholder="คำอธิบายสั้นๆ ที่จะแสดงบนการ์ดคอร์ส — แนะนำ 50‒120 ตัวอักษร" rows={3} maxLength={200}
                                            className={`${inputClass} ${(form.shortDescription?.length ?? 0) >= 50 && (form.shortDescription?.length ?? 0) <= 120 ? 'ring-1 ring-green-400 border-green-300' : ''}`} />
                                        <p className="text-[11px] text-gray-400 mt-1">50–120 ตัวอักษรดีที่สุด</p>
                                    </div>
                                    <RichTextarea label="คำอธิบายเต็มๆ" value={form.description || ""} onChange={(val) => updateForm("description", val)} placeholder="รายละเอียดเนื้อหา สิ่งที่จะได้รับ…" rows={6} />
                                </div>
                            </SectionCard>

                            <SectionCard title="สื่อการสอน" icon={Video}>
                                <div className="space-y-4">
                                    <ImageUpload label="ภาพปก (16:9)" value={thumbnailFile} onChange={setThumbnailFile} />
                                    <div className="grid grid-cols-1 gap-4 pt-4 border-t border-gray-100">
                                        <div>
                                            <label className={labelClass}>ผู้ให้บริการวิดีโอตัวอย่าง</label>
                                            <select value={form.videoProvider} onChange={(e) => updateForm("videoProvider", e.target.value)} className={inputClass}>
                                                <option value="YOUTUBE">YouTube</option>
                                                <option value="GUMLET">Gumlet</option>
                                            </select>
                                        </div>
                                        {form.videoProvider === 'GUMLET' ? (
                                            <div>
                                                <label className={labelClass}>วิดีโอตัวอย่าง (Gumlet Video ID)</label>
                                                <div className="relative flex items-center gap-2">
                                                    <div className="relative flex-1">
                                                        <Video className={`absolute left-3 top-1/2 -translate-y-1/2 ${form.gumletVideoId ? 'text-green-500' : 'text-gray-400'}`} size={16} />
                                                        <input type="text" value={form.gumletVideoId || ""} onChange={(e) => updateForm("gumletVideoId", e.target.value)} className={`w-full h-10 px-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary/30 outline-none text-sm pl-10 pr-20 ${form.gumletVideoId && form.gumletVideoId.length > 5 ? 'border-green-300 bg-green-50/30 text-green-800' : 'bg-white'}`} placeholder="กรอก Video ID หรืออัปโหลดไฟล์..." disabled={uploadingGumlet} />
                                                        {form.gumletVideoId && !uploadingGumlet && <button type="button" onClick={() => updateForm("gumletVideoId", "")} className="absolute right-12 top-1/2 -translate-y-1/2 text-red-400 hover:text-red-500">✗</button>}
                                                    </div>
                                                    <div className="absolute right-1 top-1/2 -translate-y-1/2 flex">
                                                        <input type="file" accept="video/mp4,video/x-m4v,video/*" onChange={handleGumletVideoUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" disabled={uploadingGumlet} title="อัปโหลดวิดีโอใหม่" />
                                                        <button type="button" disabled={uploadingGumlet} className={`h-8 px-2 rounded-md text-xs font-medium transition-colors flex items-center justify-center ${uploadingGumlet ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-primary/10 text-primary hover:bg-primary/20'}`}>
                                                            {uploadingGumlet ? <span className="flex items-center gap-1"><svg className="animate-spin h-3 w-3" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>{gumletProgress}%</span> : <span className="flex items-center gap-1"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>อัปโหลด</span>}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div>
                                                <label className={labelClass}>ลิงก์วิดีโอตัวอย่าง (Youtube / MP4)</label>
                                                <input type="url" value={form.demoVideoUrl || ""} onChange={(e) => updateForm("demoVideoUrl", e.target.value)} className={inputClass} placeholder="https://www.youtube.com/watch?v=..." />
                                            </div>
                                        )}
                                        <div>
                                            <label className={labelClass}>ไฟล์เอกสารประกอบ (ลิงก์ PDF หรืออัปโหลดใหม่)</label>
                                            <div className="flex flex-col sm:flex-row gap-2">
                                                <div className="relative flex-1">
                                                    <File className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                                    <input type="url" value={form.materialUrl || ""} onChange={(e) => updateForm("materialUrl", e.target.value)} className={`${inputClass} pl-10`} placeholder="https://example.com/handout.pdf" disabled={uploadingPdf} />
                                                </div>
                                                <div className="relative shrink-0 flex">
                                                    <input type="file" accept="application/pdf" onChange={handlePdfUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" disabled={uploadingPdf} />
                                                    <Button variant="outline" disabled={uploadingPdf} className="w-full sm:w-auto">{uploadingPdf ? "กำลังอัปโหลด..." : "เลือกไฟล์ PDF"}</Button>
                                                </div>
                                            </div>
                                            <p className="text-xs text-gray-400 mt-1.5">รองรับไฟล์ .pdf ขนาดไม่เกิน 10MB</p>
                                        </div>
                                    </div>
                                </div>
                            </SectionCard>

                            <SectionCard title="หมวดหมู่และระดับชั้น" icon={Folder}>
                                <div className="space-y-4">
                                    <div>
                                        <label className={labelClass}>หมวดหมู่หลัก <span className="text-red-500">*</span></label>
                                        <div className="flex flex-wrap gap-2">
                                            {QUICK_FILTERS.map((filter) => (
                                                <button key={filter} type="button" onClick={() => handleQuickFilter(filter)}
                                                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${activeQuickFilter === filter ? 'bg-secondary text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                                                    {filter}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    {rootCategoryId && childCategories.length > 0 && (
                                        <div>
                                            <label className={labelClass}>เลือกวิชา <span className="text-red-500">*</span></label>
                                            <select value={form.categoryId || ""} onChange={(e) => updateForm("categoryId", e.target.value || null)} className={inputClass}>
                                                <option value="" disabled>-- เลือกวิชา --</option>
                                                {childCategories.map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                                            </select>
                                        </div>
                                    )}
                                    <div>
                                        <label className={labelClass}>ระดับชั้น</label>
                                        <select value={form.levelId || ""} onChange={(e) => updateForm("levelId", e.target.value || null)} className={inputClass}>
                                            <option value="">-- เลือกระดับชั้น --</option>
                                            {levels.filter(l => {
                                                if (!activeQuickFilter || activeQuickFilter === "ทั้งหมด") return true;
                                                if (activeQuickFilter === "ประถม") return l.name.startsWith("ป.");
                                                if (activeQuickFilter === "ม.ต้น") return ["ม.1", "ม.2", "ม.3"].includes(l.name);
                                                if (activeQuickFilter === "ม.ปลาย") return ["ม.4", "ม.5", "ม.6"].includes(l.name);
                                                if (activeQuickFilter === "TCAS") return l.name === "สอบเข้ามหาลัย";
                                                if (activeQuickFilter === "SAT" || activeQuickFilter === "IELTS") return l.name === "ทั่วไป";
                                                return true;
                                            }).map((lvl) => <option key={lvl.id} value={lvl.id}>{lvl.name}</option>)}
                                        </select>
                                    </div>
                                </div>
                            </SectionCard>

                            <SectionCard title="ผู้สอน" icon={User}>
                                <InstructorMultiSelect options={instructors} value={selectedInstructors} onChange={setSelectedInstructors} required />
                            </SectionCard>
                        </div>

                        <div className="space-y-6">
                            <div className="bg-white p-5 rounded-xl border shadow-sm">
                                <div className="flex justify-between mb-2">
                                    <span className="text-sm font-bold text-gray-900 flex items-center gap-2"><Sparkles size={16} className="text-yellow-500" /> ความสมบูรณ์</span>
                                    <span>{completeness}%</span>
                                </div>
                                <div className="w-full bg-gray-100 h-2 rounded-full"><div className="bg-primary h-2 rounded-full transition-all duration-500" style={{ width: `${completeness}%` }}></div></div>
                                {createdCourseId && <p className="text-xs text-green-600 mt-3 flex items-center gap-1"><CheckCircle2 size={14} /> คอร์สถูกสร้างแล้ว</p>}
                            </div>

                            <SectionCard title="ราคา">
                                <div className="space-y-4">
                                    <NumberInput label="ราคาตั้งต้น (บาท)" value={form.originalPrice || undefined} onChange={(v) => updateForm("originalPrice", v || null)} />
                                    <NumberInput label="ราคาขาย (บาท) *" value={form.price} onChange={(v) => updateForm("price", v)} />
                                    <div>
                                        <label className={labelClass}>ช่วงราคา</label>
                                        <select value={form.priceRange || ""} onChange={(e) => updateForm("priceRange", e.target.value || null)} className={inputClass}>
                                            <option value="">-- เลือกช่วงราคา --</option>
                                            <option value="under-1000">ต่ำกว่า 1,000 บาท</option>
                                            <option value="1000-3000">1,000 - 3,000 บาท</option>
                                            <option value="3000-5000">3,000 - 5,000 บาท</option>
                                            <option value="5000-10000">5,000 - 10,000 บาท</option>
                                            <option value="above-10000">มากกว่า 10,000 บาท</option>
                                        </select>
                                    </div>
                                </div>
                            </SectionCard>

                            <SectionCard title="รูปแบบการสอน" icon={BookOpen}>
                                <div className="space-y-2">
                                    {([
                                        { value: "ONLINE", label: "Online (VDO)", icon: Monitor },
                                        { value: "ONLINE_LIVE", label: "Live (Zoom)", icon: Video },
                                        { value: "ONSITE", label: "Onsite", icon: MapPin }
                                    ] as const).map((type) => {
                                        const IconComponent = type.icon;
                                        return (
                                            <button key={type.value} type="button" onClick={() => !createdCourseId && updateForm("courseType", type.value)}
                                                className={`w-full px-4 py-3 text-left rounded-lg transition-all border flex items-center gap-3 ${form.courseType === type.value ? "bg-primary/5 border-primary/30 ring-1 ring-primary/20" : createdCourseId ? "border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed" : "border-gray-200 hover:bg-gray-50 hover:border-gray-300"}`}>
                                                <IconComponent size={18} className={form.courseType === type.value ? "text-primary" : "text-gray-400"} />
                                                <span className={`text-sm font-medium ${form.courseType === type.value ? "text-primary" : "text-gray-700"}`}>{type.label}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                                {(form.courseType === "ONLINE_LIVE" || form.courseType === "ONSITE") && (
                                    <div className="mt-4 pt-4 border-t border-gray-100">
                                        <label className={labelClass}>จำนวนที่นั่งสูงสุด <span className="text-red-500">*</span> <span className="text-xs text-gray-400 font-normal ml-1">(จำเป็นสำหรับคอร์สประเภทนี้)</span></label>
                                        <input type="number" min={1} value={form.maxSeats || ""} onChange={(e) => updateForm("maxSeats", e.target.value ? parseInt(e.target.value) : null)} placeholder="เช่น 30" className={inputClass} />
                                    </div>
                                )}
                                {form.courseType === "ONLINE_LIVE" && (
                                    <div className="mt-4 pt-4 border-t border-gray-100 space-y-4">
                                        <div>
                                            <label className={labelClass}>ลิงก์ Zoom/Google Meet (หลักสำหรับคอร์ส)</label>
                                            <input type="url" value={form.zoomLink || ""} onChange={(e) => updateForm("zoomLink", e.target.value)} placeholder="https://zoom.us/j/123456789" className={inputClass} />
                                        </div>
                                        <div>
                                            <label className={labelClass}>Meeting ID <span className="text-gray-400 text-xs">(ไม่บังคับ)</span></label>
                                            <input type="text" value={form.meetingId || ""} onChange={(e) => updateForm("meetingId", e.target.value)} placeholder="123 456 7890" className={inputClass} />
                                        </div>
                                    </div>
                                )}
                                {form.courseType === "ONSITE" && (
                                    <div className="mt-4 pt-4 border-t border-gray-100 space-y-4">
                                        <div>
                                            <label className={labelClass}>สถานที่</label>
                                            <input type="text" value={form.location || ""} onChange={(e) => updateForm("location", e.target.value)} placeholder="เช่น สถาบัน Sigma Tutor สาขาสีลม" className={inputClass} />
                                        </div>
                                        <div>
                                            <label className={labelClass}>ลิงก์ Google Map</label>
                                            <input type="url" value={form.mapUrl || ""} onChange={(e) => updateForm("mapUrl", e.target.value)} placeholder="https://maps.google.com/?q=..." className={inputClass} />
                                        </div>
                                    </div>
                                )}
                            </SectionCard>

                            <SectionCard title="ระยะเวลาเรียน">
                                <div className="grid grid-cols-3 gap-2">
                                    <div>
                                        <label className="text-[10px] font-bold text-gray-400 uppercase">วัน</label>
                                        <div className="flex items-center gap-1 border border-gray-300 rounded-lg px-2 bg-white focus-within:ring-2 focus-within:ring-primary/30">
                                            <input type="number" min="0" value={parsedDuration.d} onChange={(e) => handleDurationChange('d', e.target.value)} className="w-full h-10 outline-none text-sm bg-transparent text-center" placeholder="0" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-gray-400 uppercase">ชม.</label>
                                        <div className="flex items-center gap-1 border border-gray-300 rounded-lg px-2 bg-white focus-within:ring-2 focus-within:ring-primary/30">
                                            <input type="number" min="0" value={parsedDuration.h} onChange={(e) => handleDurationChange('h', e.target.value)} className="w-full h-10 outline-none text-sm bg-transparent text-center" placeholder="0" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-gray-400 uppercase">นาที</label>
                                        <div className="flex items-center gap-1 border border-gray-300 rounded-lg px-2 bg-white focus-within:ring-2 focus-within:ring-primary/30">
                                            <input type="number" min="0" value={parsedDuration.m} onChange={(e) => handleDurationChange('m', e.target.value)} className="w-full h-10 outline-none text-sm bg-transparent text-center" placeholder="0" />
                                        </div>
                                    </div>
                                </div>
                            </SectionCard>

                            <SectionCard title="อายุการเข้าถึงคอร์ส">
                                <div className="flex items-center gap-2">
                                    <input type="number" min="1" value={form.accessDurationDays ?? 365} onChange={(e) => updateForm("accessDurationDays", parseInt(e.target.value) || 365)} className="w-28 h-10 px-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary/30 outline-none text-sm text-center" />
                                    <span className="text-sm text-gray-500">วัน (ค่าเริ่มต้น 365 = 1 ปี)</span>
                                </div>
                            </SectionCard>
                        </div>

                    </div>
                )}

                {activeTab === "content" && fakeCourse && (
                    <>
                        {form.courseType === "ONLINE" && <LessonsTab course={fakeCourse} onUpdate={() => {}} />}
                        {form.courseType === "ONLINE_LIVE" && <LiveScheduleTab course={fakeCourse} onUpdate={() => {}} />}
                        {form.courseType === "ONSITE" && <OnsiteScheduleTab course={fakeCourse} onUpdate={() => {}} />}
                    </>
                )}
            </div>
        </AdminFormLayout>
    );
}

function TabButton({ active, onClick, icon: Icon, label, disabled }: {
    active: boolean;
    onClick: (() => void) | undefined;
    icon: any;
    label: string;
    disabled?: boolean;
}) {
    return (
        <button onClick={onClick} disabled={disabled}
            className={`flex items-center gap-2 px-6 py-3 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${disabled ? "border-transparent text-gray-300 cursor-not-allowed" : active ? "border-primary text-primary" : "border-transparent text-gray-500 hover:text-gray-700"}`}>
            <Icon size={18} /> {label}
            {disabled && <span className="text-[10px] bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded-full">บันทึกก่อน</span>}
        </button>
    );
}
