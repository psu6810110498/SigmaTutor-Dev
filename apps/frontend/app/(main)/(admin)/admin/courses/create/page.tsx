"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
    FileText, Video, Folder, DollarSign, Globe, MapPin, Users, Monitor,
    Save, ChevronLeft, Tag, User, Award, Sparkles, BookOpen, CalendarDays
} from "lucide-react";
import { courseApi, categoryApi, levelApi, userApi, scheduleApi } from "@/app/lib/api";
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

// 7 Quick Filter labels — same as explore page
const QUICK_FILTERS = ["ทั้งหมด", "ประถม", "ม.ต้น", "ม.ปลาย", "TCAS", "SAT", "IELTS"];

export default function CreateCoursePage() {
    const router = useRouter();
    const { toast } = useToast();

    // ── Reference Data ───────────────────────────────────────
    const [categories, setCategories] = useState<Category[]>([]);
    const [levels, setLevels] = useState<Level[]>([]);
    const [instructors, setInstructors] = useState<any[]>([]);

    useEffect(() => {
        categoryApi.list().then((r) => { if (r.success && r.data) setCategories(r.data); });
        levelApi.list().then((r) => { if (r.success && r.data) setLevels(r.data); });
        userApi.list().then((r) => {
            if (r.success && r.data) {
                setInstructors(r.data.filter((u: any) => u.role === 'ADMIN' || u.role === 'INSTRUCTOR'));
            }
        });
    }, []);

    // ── Derived Categories (Quick Filter → Subject) ──────────
    const rootCategories = useMemo(() => categories.filter(c => !c.parentId), [categories]);
    const [rootCategoryId, setRootCategoryId] = useState<string>("");
    const [activeQuickFilter, setActiveQuickFilter] = useState<string>("ทั้งหมด");

    const childCategories = useMemo(() => {
        if (!rootCategoryId) return [];
        return categories.filter(c => c.parentId === rootCategoryId);
    }, [categories, rootCategoryId]);

    const handleQuickFilter = (label: string) => {
        setActiveQuickFilter(label);
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

    // ── Form State ────────────────────────────────────────────
    const [form, setForm] = useState<CreateCourseInput>({
        title: "",
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
        published: false,
        tags: [],
        isBestSeller: false,
        isRecommended: false,
    });

    const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
    const [sessions, setSessions] = useState<ScheduleSession[]>([]);
    const [saving, setSaving] = useState(false);

    // ── Auto-Save Draft ──────────────────────────────────────
    useEffect(() => {
        const saved = localStorage.getItem(DRAFT_KEY);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (parsed.form) setForm(prev => ({ ...prev, ...parsed.form }));
                if (parsed.sessions) setSessions(parsed.sessions);
                if (parsed.rootCategoryId) setRootCategoryId(parsed.rootCategoryId);
                if (parsed.activeQuickFilter) setActiveQuickFilter(parsed.activeQuickFilter);
                setTimeout(() => toast.info("กู้คืนข้อมูลแบบร่างเรียบร้อยแล้ว"), 100);
            } catch (e) { console.error("Failed to parse draft", e); }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            localStorage.setItem(DRAFT_KEY, JSON.stringify({
                form,
                sessions,
                rootCategoryId,
                activeQuickFilter,
            }));
        }, 1000);
        return () => clearTimeout(timer);
    }, [form, sessions, rootCategoryId, activeQuickFilter]);

    // ── Helpers ───────────────────────────────────────────────
    const updateForm = <K extends keyof CreateCourseInput>(key: K, value: CreateCourseInput[K]) => {
        setForm((prev) => ({ ...prev, [key]: value }));
    };

    // ── Submit ────────────────────────────────────────────────
    const handleSubmit = async () => {
        setSaving(true);

        if (!form.title.trim()) {
            toast.error("กรุณากรอกชื่อคอร์ส");
            setSaving(false);
            return;
        }
        if (!form.instructorId) {
            toast.error("กรุณาเลือกผู้สอน");
            setSaving(false);
            return;
        }

        const res = await courseApi.create(form);

        if (!res.success) {
            toast.error(res.error || "เกิดข้อผิดพลาด");
            setSaving(false);
            return;
        }

        const courseId = res.data?.id;

        // Upload thumbnail
        if (thumbnailFile && courseId) {
            await courseApi.uploadThumbnail(courseId, thumbnailFile);
        }

        // Create schedule sessions
        if (courseId && sessions.length > 0) {
            await Promise.allSettled(
                sessions.map((s) =>
                    scheduleApi.create({
                        courseId,
                        topic: s.title || 'ไม่ระบุหัวข้อ',
                        date: s.date || new Date().toISOString().split('T')[0],
                        startTime: s.startTime || '09:00',
                        endTime: s.endTime || '10:00',
                        ...(s.location ? { location: s.location } : {}),
                        ...(s.zoomLink ? { zoomLink: s.zoomLink } : {}),
                    }).catch(() => null)
                )
            );
        }

        localStorage.removeItem(DRAFT_KEY);
        toast.success("สร้างคอร์สสำเร็จแล้ว 🎉");
        router.push("/admin/courses");
    };

    // ── Completeness Meter ───────────────────────────────────
    const completeness = useMemo(() => {
        let filled = 0;
        const total = 6;
        if (form.title.trim()) filled++;
        if (form.description) filled++;
        if (form.categoryId) filled++;
        if (form.price > 0) filled++;
        if (form.instructorId) filled++;
        if (thumbnailFile) filled++;
        return Math.round((filled / total) * 100);
    }, [form, thumbnailFile]);

    // ── Shared Styles ────────────────────────────────────────
    const inputClass = "w-full h-10 px-3 rounded-lg border border-gray-300 bg-white text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all";
    const labelClass = "block text-sm font-medium text-gray-700 mb-1.5";

    // ── Actions ──────────────────────────────────────────────
    const actions = (
        <>
            <Link href="/admin/courses">
                <Button variant="ghost" disabled={saving}>
                    <ChevronLeft size={16} className="mr-1" /> ยกเลิก
                </Button>
            </Link>
            <Button onClick={handleSubmit} isLoading={saving}>
                <Save size={16} className="mr-1.5" /> บันทึกคอร์ส
            </Button>
        </>
    );

    return (
        <AdminFormLayout
            title="สร้างคอร์สใหม่"
            description="กรอกข้อมูลคอร์สเพื่อเริ่มสอน"
            breadcrumbs={[
                { label: 'แดชบอร์ด', href: '/admin' },
                { label: 'จัดการคอร์ส', href: '/admin/courses' },
                { label: 'สร้างคอร์สใหม่', href: '#' }
            ]}
            actions={actions}
        >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* ── Left Column (Main Content) ────────────────── */}
                <div className="lg:col-span-2 space-y-6">

                    {/* 1. General Info */}
                    <SectionCard title="ข้อมูลทั่วไป" icon={FileText}>
                        <div className="space-y-4">
                            <div>
                                <label className={labelClass}>ชื่อคอร์ส <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    value={form.title}
                                    onChange={(e) => updateForm("title", e.target.value)}
                                    placeholder="เช่น ฟิสิกส์ A-Level ฉบับแม่นยำ"
                                    className={inputClass}
                                />
                                {form.title.length > 0 && form.title.length < 3 && (
                                    <p className="text-xs text-red-500 mt-1">ชื่อคอร์สต้องมีอย่างน้อย 3 ตัวอักษร</p>
                                )}
                            </div>

                            <RichTextarea
                                label="คำอธิบายคอร์ส"
                                value={form.description || ""}
                                onChange={(val) => updateForm("description", val)}
                                placeholder="รายละเอียดเนื้อหา สิ่งที่จะได้รับ…"
                                rows={6}
                            />

                            {/* Tags */}
                            <div>
                                <label className={labelClass}>
                                    Tags (คั่นด้วยจุลภาค) <Tag size={14} className="inline ml-1 text-gray-400" />
                                </label>
                                <input
                                    type="text"
                                    value={form.tags?.join(", ") || ""}
                                    onChange={(e) => updateForm("tags", e.target.value.split(",").map(t => t.trim()).filter(Boolean))}
                                    className={inputClass}
                                    placeholder="เช่น คณิตศาสตร์, สอบเข้า, แนะนำ"
                                />
                                {(form.tags?.length || 0) > 0 && (
                                    <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                                        {form.tags?.map((tag, i) => (
                                            <span key={i} className="inline-flex items-center bg-blue-50 text-blue-700 text-xs font-medium px-2 py-0.5 rounded-full">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </SectionCard>

                    {/* 2. Media */}
                    <SectionCard title="สื่อการสอน" icon={Video}>
                        <ImageUpload
                            label="ภาพปก (16:9)"
                            value={thumbnailFile}
                            onChange={setThumbnailFile}
                        />
                    </SectionCard>

                    {/* 3. Instructor */}
                    <SectionCard title="ผู้สอน" icon={User}>
                        <div>
                            <label className={labelClass}>เลือกผู้สอน <span className="text-red-500">*</span></label>
                            <select
                                value={form.instructorId || ""}
                                onChange={(e) => updateForm("instructorId", e.target.value || undefined)}
                                className={inputClass}
                            >
                                <option value="">-- เลือกผู้สอน --</option>
                                {instructors.map((inst) => (
                                    <option key={inst.id} value={inst.id}>
                                        {inst.name} ({inst.email})
                                    </option>
                                ))}
                            </select>
                        </div>
                    </SectionCard>

                    {/* 4. Schedule Table */}
                    <SectionCard title="ตารางเรียน" icon={CalendarDays}>
                        <div className="mb-3">
                            {form.courseType === 'ONLINE' && (
                                <p className="text-xs text-gray-500 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
                                    📹 กำหนดลำดับบทเรียน / หัวข้อวิดีโอ สำหรับคอร์ส Online
                                </p>
                            )}
                            {form.courseType === 'ONLINE_LIVE' && (
                                <p className="text-xs text-gray-500 bg-purple-50 border border-purple-100 rounded-lg px-3 py-2">
                                    🎥 กำหนดวันที่, เวลา, และ Zoom Link สำหรับแต่ละครั้งที่เรียนสด
                                </p>
                            )}
                            {form.courseType === 'ONSITE' && (
                                <p className="text-xs text-gray-500 bg-orange-50 border border-orange-100 rounded-lg px-3 py-2">
                                    🏫 กำหนดวันที่, เวลา และสถานที่ สำหรับแต่ละครั้งที่เรียน
                                </p>
                            )}
                        </div>
                        <ScheduleInput
                            courseType={form.courseType as any}
                            value={sessions}
                            onChange={setSessions}
                        />
                    </SectionCard>

                    {/* 5. Enrollment Settings (ONLINE_LIVE / ONSITE) */}
                    {(form.courseType === "ONLINE_LIVE" || form.courseType === "ONSITE") && (
                        <SectionCard title="การรับสมัคร" icon={Users} className="animate-fade-in-up">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <NumberInput
                                    label="จำนวนรับสูงสุด"
                                    value={form.maxSeats || 0}
                                    onChange={(val) => updateForm("maxSeats", val)}
                                />
                                <div>
                                    <label className={labelClass}>ช่วงเวลาเปิดรับ</label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="date"
                                            value={form.enrollStartDate ? new Date(form.enrollStartDate).toISOString().split('T')[0] : ""}
                                            onChange={(e) => updateForm("enrollStartDate", e.target.value || null)}
                                            className={inputClass}
                                        />
                                        <span className="text-gray-400">-</span>
                                        <input
                                            type="date"
                                            value={form.enrollEndDate ? new Date(form.enrollEndDate).toISOString().split('T')[0] : ""}
                                            onChange={(e) => updateForm("enrollEndDate", e.target.value || null)}
                                            className={inputClass}
                                        />
                                    </div>
                                </div>
                            </div>
                        </SectionCard>
                    )}

                    {/* 6. Location (ONSITE) */}
                    {form.courseType === "ONSITE" && (
                        <SectionCard title="สถานที่เรียน" icon={MapPin} className="animate-fade-in-up">
                            <div className="space-y-4">
                                <div>
                                    <label className={labelClass}>สถานที่</label>
                                    <input
                                        type="text"
                                        value={form.location || ""}
                                        onChange={(e) => updateForm("location", e.target.value)}
                                        placeholder="ระบุอาคาร ห้องเรียน..."
                                        className={inputClass}
                                    />
                                </div>
                                <div>
                                    <label className={labelClass}>Google Map URL</label>
                                    <input
                                        type="url"
                                        value={form.mapUrl || ""}
                                        onChange={(e) => updateForm("mapUrl", e.target.value)}
                                        placeholder="https://maps.google.com/..."
                                        className={inputClass}
                                    />
                                </div>
                            </div>
                        </SectionCard>
                    )}

                    {/* 7. Zoom (ONLINE_LIVE) */}
                    {form.courseType === "ONLINE_LIVE" && (
                        <SectionCard title="ช่องทางเรียนสด" icon={Monitor} className="animate-fade-in-up">
                            <div>
                                <label className={labelClass}>Zoom Link (Default)</label>
                                <input
                                    type="url"
                                    value={form.zoomLink || ""}
                                    onChange={(e) => updateForm("zoomLink", e.target.value)}
                                    placeholder="https://zoom.us/j/..."
                                    className={inputClass}
                                />
                                <p className="text-xs text-gray-400 mt-1">สามารถกำหนด Zoom แยกแต่ละครั้งในตารางเรียนด้านบนได้</p>
                            </div>
                        </SectionCard>
                    )}
                </div>

                {/* ── Right Column (Sidebar) ────────────────────── */}
                <div className="space-y-6">

                    {/* Completeness Meter */}
                    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                                <Sparkles size={16} className="text-yellow-500" /> ความสมบูรณ์
                            </span>
                            <span className={`text-sm font-bold ${completeness === 100 ? 'text-green-600' : 'text-gray-500'}`}>
                                {completeness}%
                            </span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2.5">
                            <div
                                className={`h-2.5 rounded-full transition-all duration-500 ${completeness === 100 ? 'bg-green-500' : completeness >= 60 ? 'bg-blue-500' : 'bg-orange-400'}`}
                                style={{ width: `${completeness}%` }}
                            />
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                            {completeness < 100 ? 'กรอกข้อมูลให้ครบเพื่อเผยแพร่คอร์ส' : '✅ พร้อมเผยแพร่!'}
                        </p>
                    </div>

                    {/* Status & Badges */}
                    <SectionCard title="สถานะ" icon={Globe}>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-gray-700">เผยแพร่คอร์ส</span>
                                <button
                                    type="button"
                                    onClick={() => updateForm("published", !form.published)}
                                    className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${form.published ? "bg-green-500" : "bg-gray-200"}`}
                                >
                                    <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform duration-200 ${form.published ? "translate-x-5" : ""}`} />
                                </button>
                            </div>
                            <p className="text-xs text-gray-500">
                                {form.published ? "คอร์สจะแสดงบนหน้าเว็บทันที" : "คอร์สจะเป็นแบบร่าง (Draft)"}
                            </p>
                            <div className="border-t border-gray-100 pt-3 space-y-2.5">
                                <label className="flex items-center justify-between cursor-pointer">
                                    <span className="text-sm text-gray-700 flex items-center gap-1.5">
                                        <Award size={14} className="text-orange-500" /> Best Seller
                                    </span>
                                    <input
                                        type="checkbox"
                                        checked={form.isBestSeller || false}
                                        onChange={(e) => updateForm("isBestSeller", e.target.checked)}
                                        className="w-4 h-4 text-primary rounded focus:ring-primary"
                                    />
                                </label>
                                <label className="flex items-center justify-between cursor-pointer">
                                    <span className="text-sm text-gray-700 flex items-center gap-1.5">
                                        <Award size={14} className="text-blue-500" /> Recommended
                                    </span>
                                    <input
                                        type="checkbox"
                                        checked={form.isRecommended || false}
                                        onChange={(e) => updateForm("isRecommended", e.target.checked)}
                                        className="w-4 h-4 text-primary rounded focus:ring-primary"
                                    />
                                </label>
                            </div>
                        </div>
                    </SectionCard>

                    {/* Course Type */}
                    <SectionCard title="รูปแบบการสอน" icon={BookOpen}>
                        <div className="space-y-1.5">
                            {([
                                { value: "ONLINE", label: "📹 Online (VDO)", desc: "เรียนผ่านวิดีโอ เมื่อไหร่ก็ได้" },
                                { value: "ONLINE_LIVE", label: "🎥 Live (Zoom)", desc: "เรียนสดผ่าน Zoom" },
                                { value: "ONSITE", label: "🏫 Onsite (สถานที่)", desc: "เรียนที่สถาบัน" },
                            ] as const).map((type) => (
                                <button
                                    key={type.value}
                                    type="button"
                                    onClick={() => updateForm("courseType", type.value)}
                                    className={`w-full px-3 py-2.5 text-left rounded-lg transition-all border ${form.courseType === type.value
                                        ? "bg-primary/5 border-primary/30 ring-1 ring-primary/20"
                                        : "border-transparent hover:bg-gray-50"
                                        }`}
                                >
                                    <span className={`text-sm font-medium ${form.courseType === type.value ? "text-primary" : "text-gray-700"}`}>
                                        {type.label}
                                    </span>
                                    <p className="text-xs text-gray-500 mt-0.5">{type.desc}</p>
                                </button>
                            ))}
                        </div>
                    </SectionCard>

                    {/* Category — Quick Filters + Subject + Level */}
                    <SectionCard title="หมวดหมู่" icon={Folder}>
                        <div className="space-y-4">
                            {/* 7 Quick Filter chips */}
                            <div>
                                <label className={labelClass}>หมวดหลัก</label>
                                <div className="flex flex-wrap gap-1.5">
                                    {QUICK_FILTERS.map((f) => (
                                        <button
                                            key={f}
                                            type="button"
                                            onClick={() => handleQuickFilter(f)}
                                            className={`px-3 py-1 rounded-full text-xs font-medium transition-all border ${activeQuickFilter === f
                                                ? "bg-primary text-white border-primary shadow-sm"
                                                : "bg-white text-gray-600 border-gray-200 hover:border-primary/40 hover:text-primary"
                                                }`}
                                        >
                                            {f}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Subject dropdown (shown when a root has children) */}
                            {rootCategoryId && childCategories.length > 0 && (
                                <div className="animate-fade-in-up">
                                    <label className={labelClass}>วิชา (Subject)</label>
                                    <select
                                        value={form.categoryId || ""}
                                        onChange={(e) => updateForm("categoryId", e.target.value || null)}
                                        className={inputClass}
                                    >
                                        <option value="">เลือกวิชา</option>
                                        {childCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                            )}

                            {/* Level dropdown */}
                            <div>
                                <label className={labelClass}>ระดับชั้น</label>
                                <select
                                    value={form.levelId || ""}
                                    onChange={(e) => updateForm("levelId", e.target.value || null)}
                                    className={inputClass}
                                >
                                    <option value="">เลือกระดับชั้น</option>
                                    {levels.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                                </select>
                            </div>
                        </div>
                    </SectionCard>

                    {/* Pricing */}
                    <SectionCard title="ราคา" icon={DollarSign}>
                        <div className="space-y-4">
                            <NumberInput
                                label="ราคาขาย (บาท) *"
                                value={form.price}
                                onChange={(val) => updateForm("price", val)}
                                placeholder="0"
                            />
                            <NumberInput
                                label="ราคาโปรโมชั่น"
                                value={form.promotionalPrice || undefined}
                                onChange={(val) => updateForm("promotionalPrice", val || null)}
                                placeholder="ราคาลด"
                            />
                            <NumberInput
                                label="ราคาเต็ม (ขีดฆ่า)"
                                value={form.originalPrice || undefined}
                                onChange={(val) => updateForm("originalPrice", val || null)}
                                placeholder="Optional"
                            />
                            {form.promotionalPrice && form.price > 0 && form.promotionalPrice < form.price && (
                                <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-700">
                                    💰 ส่วนลด {Math.round(((form.price - form.promotionalPrice) / form.price) * 100)}%
                                </div>
                            )}
                        </div>
                    </SectionCard>
                </div>
            </div>
        </AdminFormLayout>
    );
}

