"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
    FileText, Video, Folder, Globe, MapPin, Users, Monitor,
    Save, ChevronLeft, Tag, User, Award, Sparkles, BookOpen, CalendarDays, File
} from "lucide-react";
import { courseApi, categoryApi, levelApi, scheduleApi } from "@/app/lib/api";
import type { Category, Level, CreateCourseInput } from "@/app/lib/types";
import { useToast } from "@/app/components/ui/Toast";
import { AdminFormLayout } from "@/app/components/layouts/AdminFormLayout";
import { SectionCard } from "@/app/components/ui/SectionCard";
import { NumberInput } from "@/app/components/ui/NumberInput";
import { RichTextarea } from "@/app/components/ui/RichTextarea";
import { ImageUpload } from "@/app/components/ui/ImageUpload";
import { Button } from "@/app/components/ui/Button";
import { ScheduleInput, type ScheduleSession } from "@/app/components/ui/ScheduleInput";

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

    // ── ข้อมูลอ้างอิงจาก API ──
    const [categories, setCategories] = useState<Category[]>([]);
    const [levels, setLevels] = useState<Level[]>([]);
    const [instructors, setInstructors] = useState<any[]>([]);

    useEffect(() => {
        categoryApi.list().then((r) => { if (r.success && r.data) setCategories(r.data); });
        levelApi.list().then((r) => { if (r.success && r.data) setLevels(r.data); });

        const fetchInstructors = async () => {
            try {
                const res = await fetch('http://localhost:4000/api/users/instructors', { credentials: 'include' });
                const data = await res.json();
                if (data.success) setInstructors(data.data);
            } catch (error) { console.error("Failed to fetch instructors:", error); }
        };
        fetchInstructors();
    }, []);

    // ── จัดการหมวดหมู่และระดับชั้น ──
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
        title: "", shortDescription: "", description: "", price: 0, originalPrice: null, promotionalPrice: null,
        courseType: "ONLINE", categoryId: null, levelId: null, instructorId: undefined, duration: null,
        videoCount: 0, maxSeats: null, enrollStartDate: null, enrollEndDate: null, location: null, mapUrl: null,
        zoomLink: null, meetingId: null, courseCode: "", priceRange: null, demoVideoUrl: "", materialUrl: "",
        published: false, tags: [], isBestSeller: false, isRecommended: false,
    });

    const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
    const [sessions, setSessions] = useState<ScheduleSession[]>([]);
    const [saving, setSaving] = useState(false);
    const [uploadingPdf, setUploadingPdf] = useState(false);
    const [createdCourseId, setCreatedCourseId] = useState<string | null>(null);

    // ── จัดการข้อมูลแบบร่าง (Draft) ──
    useEffect(() => {
        const saved = localStorage.getItem(DRAFT_KEY);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (parsed.form) setForm(prev => ({ ...prev, ...parsed.form }));
                if (parsed.sessions) setSessions(parsed.sessions);
                if (parsed.rootCategoryId) setRootCategoryId(parsed.rootCategoryId);
                if (parsed.activeQuickFilter) setActiveQuickFilter(parsed.activeQuickFilter);
            } catch (e) { console.error(e); }
        }
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            localStorage.setItem(DRAFT_KEY, JSON.stringify({ form, sessions, rootCategoryId, activeQuickFilter }));
        }, 1000);
        return () => clearTimeout(timer);
    }, [form, sessions, rootCategoryId, activeQuickFilter]);

    const updateForm = (key: string, value: any) => setForm((prev: any) => ({ ...prev, [key]: value }));

    const handleQuickFilter = (label: string) => {
        setActiveQuickFilter(label);
        updateForm("levelId", null);
        if (label === "ทั้งหมด") {
            setRootCategoryId("");
            setForm(prev => ({ ...prev, categoryId: null }));
            return;
        }
        const found = rootCategories.find(c => c.name === label);
        if (found) {
            setRootCategoryId(found.id);
            setForm(prev => ({ ...prev, categoryId: null }));
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
        } catch (error) { console.error(error); } finally { setUploadingPdf(false); }
    };

    // ── กดบันทึก (Submit) ──
    const handleSubmit = async () => {
        setSaving(true);
        if (!form.title.trim() || !form.instructorId) {
            toast.error("กรุณากรอกชื่อคอร์สและเลือกผู้สอน");
            setSaving(false); return;
        }

        const payload: any = { ...form };

        // แปลงรูปแบบวันที่และจัดการค่าว่าง
        ['enrollStartDate', 'enrollEndDate'].forEach(key => {
            if (payload[key]) {
                try { payload[key] = new Date(payload[key]).toISOString(); } catch { payload[key] = null; }
            } else { payload[key] = null; }
        });

        // Normalize optional URL/string fields. Keep descriptions as strings (empty string when missing)
        ['demoVideoUrl', 'location', 'materialUrl'].forEach((key) => {
            if (payload[key] === "") payload[key] = null;
        });

        // Ensure description and shortDescription are sent as empty strings (not null)
        payload.description = payload.description || "";
        payload.shortDescription = payload.shortDescription || "";

        // Include sessions from ScheduleInput in the request payload
        payload.schedules = sessions.map((s: any) => ({
            title: s.title || "",
            chapterTitle: s.chapterTitle || null,
            videoUrl: s.videoUrl || null,
            materialUrl: s.materialUrl || null,
            sessionNumber: s.sessionNumber || undefined,
        }));

        // ✅ จัดการเรื่อง ID ระดับชั้น (ป้องกัน Error 400)
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
                setCreatedCourseId(newId);
                if (thumbnailFile) await courseApi.uploadThumbnail(newId, thumbnailFile);

                // sync schedules explicitly after creation to avoid cases where
                // nested create might be ignored or user adds more entries before
                // redirect. this also ensures edit page sees content immediately.
                if (sessions.length > 0) {
                    try {
                        await scheduleApi.sync(newId, sessions);
                    } catch (err) {
                        console.warn("schedule sync failed", err);
                    }
                }

                localStorage.removeItem(DRAFT_KEY);
                toast.success("สร้างคอร์สสำเร็จแล้ว 🎉");
                router.push("/admin/courses");
            } else { toast.error(res.error || "สร้างคอร์สไม่สำเร็จ"); }
        } catch (error) { toast.error("เกิดข้อผิดพลาดในการเชื่อมต่อ"); } finally { setSaving(false); }
    };

    const completeness = useMemo(() => {
        let filled = 0; if (form.title.trim()) filled++; if (form.description) filled++; if (form.price > 0) filled++;
        if (form.instructorId) filled++; if (thumbnailFile) filled++;
        return Math.round((filled / 5) * 100);
    }, [form, thumbnailFile]);

    const inputClass = "w-full h-10 px-3 rounded-lg border border-gray-300 bg-white text-sm focus:ring-2 focus:ring-primary/30 outline-none transition-all";
    const labelClass = "block text-sm font-medium text-gray-700 mb-1.5";

    return (
        <AdminFormLayout
            title="สร้างคอร์สใหม่"
            description="กรอกข้อมูลคอร์สเพื่อเริ่มสอน คอร์สที่สร้างจะแสดงในหน้าค้นหาอัตโนมัติ"
            // ✅ เพิ่มกลับเข้ามาเพื่อแก้ปัญหาหน้าขาว (TypeError: map of undefined)
            breadcrumbs={[
                { label: 'แดชบอร์ด', href: '/admin' },
                { label: 'จัดการคอร์ส', href: '/admin/courses' },
                { label: 'สร้างคอร์สใหม่', href: '#' }
            ]}
            actions={<><Link href="/admin/courses"><Button variant="ghost">ยกเลิก</Button></Link><Button onClick={handleSubmit} isLoading={saving}><Save size={18} className="mr-2" /> บันทึกคอร์ส</Button></>}
        >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <SectionCard title="ข้อมูลทั่วไป" icon={FileText}>
                        <div className="space-y-4">
                            <div><label className={labelClass}>ชื่อคอร์ส *</label><input type="text" value={form.title} onChange={(e) => updateForm("title", e.target.value)} className={inputClass} /></div>
                            <div><label className={labelClass}>คำอธิบายสั้นๆ *</label><textarea value={form.shortDescription || ""} onChange={(e) => updateForm("shortDescription", e.target.value)} rows={2} className={inputClass} /></div>
                            <RichTextarea label="คำอธิบายเต็มๆ" value={form.description || ""} onChange={(val) => updateForm("description", val)} rows={6} />
                        </div>
                    </SectionCard>
                    <SectionCard title="สื่อการสอน" icon={Video}>
                        <ImageUpload label="ภาพปก" value={thumbnailFile} onChange={setThumbnailFile} />
                        <div className="mt-4 grid grid-cols-1 gap-4">
                            <div><label className={labelClass}>YouTube URL</label><input type="url" value={form.demoVideoUrl} onChange={(e) => updateForm("demoVideoUrl", e.target.value)} className={inputClass} placeholder="https://www.youtube.com/watch?v=..." /></div>
                            <div>
                                <label className={labelClass}>ไฟล์เอกสาร (PDF)</label>
                                <div className="flex flex-col sm:flex-row gap-2">
                                    <input type="text" value={form.materialUrl} readOnly className={`${inputClass} bg-gray-50 flex-1`} placeholder="อัปโหลดไฟล์เพื่อรับลิงก์..." />
                                    <div className="relative">
                                        <input type="file" accept=".pdf" onChange={handlePdfUpload} className="hidden" id="pdf-upload-btn" disabled={uploadingPdf} />
                                        <label htmlFor="pdf-upload-btn" className="h-10 px-4 bg-white border border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:bg-gray-50 text-sm font-medium transition-colors">
                                            {uploadingPdf ? "กำลังอัปโหลด..." : "เลือกไฟล์ PDF"}
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </SectionCard>
                    <SectionCard title="หมวดหมู่และระดับชั้น" icon={Folder}>
                        <div className="flex flex-wrap gap-2 mb-4">
                            {QUICK_FILTERS.map(f => (
                                <button key={f} type="button" onClick={() => handleQuickFilter(f)} className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${activeQuickFilter === f ? 'bg-secondary text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                                    {f}
                                </button>
                            ))}
                        </div>
                        {rootCategoryId && childCategories.length > 0 && (
                            <div className="mb-4">
                                <label className={labelClass}>เลือกวิชา *</label>
                                <select value={form.categoryId || ""} onChange={(e) => updateForm("categoryId", e.target.value)} className={inputClass}>
                                    <option value="" disabled>-- เลือกวิชา --</option>
                                    {childCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                        )}
                        {showLevelDropdown && (
                            <div>
                                <label className={labelClass}>ระดับชั้น</label>
                                <select value={form.levelId || ""} onChange={(e) => updateForm("levelId", e.target.value)} className={inputClass}>
                                    <option value="">-- เลือกระดับชั้น --</option>
                                    {levelOptions.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                                </select>
                            </div>
                        )}
                    </SectionCard>
                    <SectionCard title="ผู้สอน" icon={User}>
                        <select value={form.instructorId || ""} onChange={(e) => updateForm("instructorId", e.target.value)} className={inputClass}>
                            <option value="" disabled>-- เลือกผู้สอน --</option>
                            {instructors.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                        </select>
                    </SectionCard>
                    <SectionCard title="ตารางเรียน" icon={CalendarDays}>
                        <ScheduleInput courseType={form.courseType as any} value={sessions} onChange={setSessions} />
                    </SectionCard>
                </div>
                <div className="space-y-6">
                    <div className="bg-white p-5 rounded-xl border shadow-sm">
                        <div className="flex justify-between mb-2"><span className="text-sm font-bold text-gray-900 flex items-center gap-2"><Sparkles size={16} className="text-yellow-500" /> ความสมบูรณ์</span><span>{completeness}%</span></div>
                        <div className="w-full bg-gray-100 h-2 rounded-full"><div className="bg-primary h-2 rounded-full transition-all duration-500" style={{ width: `${completeness}%` }}></div></div>
                    </div>
                    <SectionCard title="ราคา">
                        <div className="space-y-4">
                            <NumberInput label="ราคาตั้งต้น (บาท)" value={form.originalPrice || undefined} onChange={(v) => updateForm("originalPrice", v || null)} />
                            <NumberInput label="ราคาขาย (บาท) *" value={form.price} onChange={(v) => updateForm("price", v)} />
                            <div>
                                <label className={labelClass}>ระยะเวลาเรียน</label>
                                <input type="text" value={form.duration || ""} onChange={(e) => updateForm("duration", e.target.value || null)} className={inputClass} placeholder="เช่น 3 ชั่วโมง, 2 เดือน" />
                            </div>
                        </div>
                    </SectionCard>
                    <SectionCard title="รูปแบบการสอน" icon={BookOpen}>
                        <div className="space-y-2">
                            {([{ v: "ONLINE", l: "VDO (Online)" }, { v: "ONLINE_LIVE", l: "Zoom (Live)" }, { v: "ONSITE", l: "Onsite" }] as const).map(t => (
                                <button key={t.v} type="button" onClick={() => updateForm("courseType", t.v)} className={`w-full px-4 py-3 text-left rounded-lg border text-sm font-medium transition-all ${form.courseType === t.v ? "bg-primary/5 border-primary/30 text-primary ring-1 ring-primary/20" : "border-gray-200 hover:bg-gray-50"}`}>
                                    {t.l}
                                </button>
                            ))}
                        </div>
                    </SectionCard>
                </div>
            </div>
        </AdminFormLayout>
    );
}