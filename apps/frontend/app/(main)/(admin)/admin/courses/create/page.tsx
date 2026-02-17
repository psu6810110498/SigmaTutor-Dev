"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FileText, Video, Folder, DollarSign, Globe, Calendar, MapPin, Users, Monitor } from "lucide-react";
import { courseApi, categoryApi, levelApi } from "@/app/lib/api";
import type { Category, Level, CreateCourseInput } from "@/app/lib/types";
import { useToast } from "@/app/components/ui/Toast";
import { AdminFormLayout } from "@/app/components/layouts/AdminFormLayout";
import { SectionCard } from "@/app/components/ui/SectionCard";
import { NumberInput } from "@/app/components/ui/NumberInput";
import { RichTextarea } from "@/app/components/ui/RichTextarea";
import { ImageUpload } from "@/app/components/ui/ImageUpload";
import { Button } from "@/app/components/ui/Button";

const DRAFT_KEY = "draft_course_create";

export default function CreateCoursePage() {
    const router = useRouter();
    const { toast } = useToast();

    // ── Dropdown Data ─────────────────────────────────────
    const [categories, setCategories] = useState<Category[]>([]);
    const [levels, setLevels] = useState<Level[]>([]);

    useEffect(() => {
        categoryApi.list().then((r) => { if (r.success && r.data) setCategories(r.data); });
        levelApi.list().then((r) => { if (r.success && r.data) setLevels(r.data); });
    }, []);

    // ── Form State ────────────────────────────────────────
    const [form, setForm] = useState<CreateCourseInput>({
        title: "",
        description: "",
        price: 0,
        originalPrice: null,
        courseType: "ONLINE",
        categoryId: null,
        levelId: null,
        duration: null,
        videoCount: 0,
        maxSeats: null,
        enrollStartDate: null,
        enrollEndDate: null,
        location: null,
        mapUrl: null,
        zoomLink: null,
        published: false,
    });

    const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
    const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null); // For init load only if editing
    const [saving, setSaving] = useState(false);

    // Auto-Save Logic
    useEffect(() => {
        // Load draft on mount
        const saved = localStorage.getItem(DRAFT_KEY);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                // Simple merge for now
                setForm((prev) => ({ ...prev, ...parsed }));
                // setTimeout ensures toast shows after mount
                setTimeout(() => toast.info("กู้คืนข้อมูลแบบร่างเรียบร้อยแล้ว"), 100);
            } catch (e) {
                console.error("Failed to parse draft", e);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Run once on mount

    useEffect(() => {
        const timer = setTimeout(() => {
            localStorage.setItem(DRAFT_KEY, JSON.stringify(form));
        }, 1000);
        return () => clearTimeout(timer);
    }, [form]);

    // ── Helpers ───────────────────────────────────────────
    const updateForm = <K extends keyof CreateCourseInput>(key: K, value: CreateCourseInput[K]) => {
        setForm((prev) => ({ ...prev, [key]: value }));
    };

    // ── Submit ────────────────────────────────────────────
    const handleSubmit = async () => {
        setSaving(true);

        // Basic valid
        if (!form.title.trim()) {
            toast.error("กรุณากรอกชื่อคอร์ส");
            setSaving(false);
            return;
        }

        const res = await courseApi.create(form);

        if (!res.success) {
            toast.error(res.error || "เกิดข้อผิดพลาด");
            setSaving(false);
            return;
        }

        if (thumbnailFile && res.data) {
            await courseApi.uploadThumbnail(res.data.id, thumbnailFile);
        }

        // Clear draft
        localStorage.removeItem(DRAFT_KEY);

        toast.success("สร้างคอร์สสำเร็จแล้ว");
        router.push("/admin/courses");
    };

    // ── Actions ───────────────────────────────────────────
    const actions = (
        <>
            <Link href="/admin/courses">
                <Button variant="ghost" disabled={saving}>ยกเลิก</Button>
            </Link>
            <Button
                onClick={handleSubmit}
                isLoading={saving}
                className="w-full sm:w-auto"
            >
                บันทึกคอร์ส
            </Button>
        </>
    );

    // ── Shared Input Styles ───────────────────────────────
    const inputClass = "w-full h-10 px-3 rounded-lg border border-gray-300 bg-white text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all";
    const labelClass = "block text-sm font-medium text-gray-700 mb-1.5";

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
                                <label className={labelClass}>ชื่อคอร์ส *</label>
                                <input
                                    type="text"
                                    value={form.title}
                                    onChange={(e) => updateForm("title", e.target.value)}
                                    placeholder="เช่น ฟิสิกส์ A-Level ฉบับแม่นยำ"
                                    className={inputClass}
                                    required
                                />
                            </div>

                            <RichTextarea
                                label="คำอธิบายคอร์ส"
                                value={form.description || ""}
                                onChange={(val) => updateForm("description", val)}
                                placeholder="รายละเอียดเนื้อหา สิ่งที่จะได้รับ..."
                                rows={6}
                            />
                        </div>
                    </SectionCard>

                    {/* 2. Media */}
                    <SectionCard title="สื่อการสอน" icon={Video}>
                        <div className="space-y-4">
                            <ImageUpload
                                label="ภาพปก (16:9)"
                                value={thumbnailFile}
                                onChange={setThumbnailFile}
                            />
                            {/* Can add Video Preview URL here later */}
                        </div>
                    </SectionCard>

                    {/* 3. Enrollment Settings (Conditional) */}
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

                    {/* 4. Location / Zoom (Conditional) */}
                    {form.courseType === "ONLINE_LIVE" && (
                        <SectionCard title="ช่องทางเรียนสด" icon={Monitor} className="animate-fade-in-up">
                            <div>
                                <label className={labelClass}>Zoom Link</label>
                                <input
                                    type="url"
                                    value={form.zoomLink || ""}
                                    onChange={(e) => updateForm("zoomLink", e.target.value)}
                                    placeholder="https://zoom.us/j/..."
                                    className={inputClass}
                                />
                            </div>
                        </SectionCard>
                    )}

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
                </div>

                {/* ── Right Column (Sidebar) ────────────────────── */}
                <div className="space-y-6">

                    {/* Status */}
                    <SectionCard title="สถานะ" icon={Globe}>
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
                        <p className="text-xs text-gray-500 mt-2">
                            {form.published
                                ? "คอร์สจะแสดงบนหน้าเว็บและนักเรียนสามารถสมัครได้ทันที"
                                : "คอร์สถูกซ่อนไว้อยู่ (Draft)"}
                        </p>
                    </SectionCard>

                    {/* Course Type */}
                    <SectionCard title="รูปแบบการสอน" icon={Monitor}>
                        <div className="space-y-2">
                            {([
                                { value: "ONLINE", label: "Online (VDO)" },
                                { value: "ONLINE_LIVE", label: "Live (Zoom)" },
                                { value: "ONSITE", label: "Onsite (สถานที่)" },
                            ] as const).map((type) => (
                                <button
                                    key={type.value}
                                    type="button"
                                    onClick={() => updateForm("courseType", type.value)}
                                    className={`w-full px-3 py-2 text-left text-sm rounded-lg transition-colors ${form.courseType === type.value
                                        ? "bg-blue-50 text-blue-700 font-medium"
                                        : "hover:bg-gray-50 text-gray-700"
                                        }`}
                                >
                                    {type.label}
                                </button>
                            ))}
                        </div>
                    </SectionCard>

                    {/* Organization */}
                    <SectionCard title="หมวดหมู่" icon={Folder}>
                        <div className="space-y-4">
                            <div>
                                <label className={labelClass}>วิชา</label>
                                <select
                                    value={form.categoryId || ""}
                                    onChange={(e) => updateForm("categoryId", e.target.value || null)}
                                    className={inputClass}
                                >
                                    <option value="">เลือกวิชา</option>
                                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
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
                                label="ราคาเต็ม (ก่อนลด)"
                                value={form.originalPrice || undefined}
                                onChange={(val) => updateForm("originalPrice", val || null)}
                                placeholder="Optional"
                            />
                        </div>
                    </SectionCard>

                </div>
            </div>
        </AdminFormLayout>
    );
}
