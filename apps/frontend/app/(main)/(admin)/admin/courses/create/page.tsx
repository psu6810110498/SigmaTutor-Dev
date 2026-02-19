"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
    FileText, Video, Folder, DollarSign, Globe, MapPin, Users, Monitor,
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

// 7 Quick Filter labels — same as explore page
const QUICK_FILTERS = ["ทั้งหมด", "ประถม", "ม.ต้น", "ม.ปลาย", "TCAS", "SAT", "IELTS"];

export default function CreateCoursePage() {
    const router = useRouter();
    const { toast } = useToast();

    // ── Reference Data ───────────────────────────────────────
    const [categories, setCategories] = useState<Category[]>([]);
    const [levels, setLevels] = useState<Level[]>([]);
    const [instructors, setInstructors] = useState<any[]>([]);

    // ✅ ฟังก์ชันดึง Token ป้องกัน Error 
    const getToken = () => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('accessToken') || localStorage.getItem('token') || '';
        }
        return '';
    };

    useEffect(() => {
        // ดึงหมวดหมู่ และ ระดับชั้น (จาก API เดิม)
        categoryApi.list().then((r) => { if (r.success && r.data) setCategories(r.data); });
        levelApi.list().then((r) => { if (r.success && r.data) setLevels(r.data); });
        
        // ✅ ดึงรายชื่อคุณครูจาก API ใหม่ที่เราเพิ่งสร้าง
        const fetchInstructors = async () => {
            try {
                const token = getToken();
                const res = await fetch('http://localhost:4000/api/users/instructors', {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    credentials: 'include'
                });
                const data = await res.json();
                if (data.success) {
                    setInstructors(data.data);
                }
            } catch (error) {
                console.error("Failed to fetch instructors:", error);
            }
        };

        fetchInstructors();
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
    const [form, setForm] = useState<any>({
        title: "",
        shortDescription: "", // คำอธิบายสั้นๆ แสดงหน้าคอร์ส
        description: "", // คำอธิบายเต็มๆ
        price: 0, // ราคาขาย
        originalPrice: null, // ราคาตั้งต้น
        promotionalPrice: null,
        courseType: "ONLINE",
        categoryId: null,
        levelId: null,
        instructorId: undefined,
        duration: null,
        videoCount: 0,
        maxSeats: null, // จำนวนที่นั่งที่สุด
        enrollStartDate: null,
        enrollEndDate: null,
        location: null,
        mapUrl: null,
        zoomLink: null, // Zoom/Google Meet Link
        meetingId: null, // Meeting ID (ไม่บังคับ)
        courseCode: "", // รหัสคอร์ส
        priceRange: null, // ช่วงราคา
        // ✅ เพิ่มฟิลด์ใหม่สำหรับลิงก์วิดีโอและไฟล์
        demoVideoUrl: "",
        materialUrl: "",
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
    const updateForm = (key: string, value: any) => {
        setForm((prev: any) => ({ ...prev, [key]: value }));
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

        try {
            // ✅ ใช้ fetch ยิงตรงไปที่ /api/courses เพื่อแก้ปัญหา Route Not Found 
            const token = getToken();
            const response = await fetch('http://localhost:4000/api/courses', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                credentials: 'include',
                body: JSON.stringify(form)
            });
            
            const res = await response.json();

            if (!res.success) {
                toast.error(res.error || "เกิดข้อผิดพลาดในการสร้างคอร์ส");
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
            
        } catch (error) {
            console.error("Submit Error:", error);
            toast.error("ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้");
            setSaving(false);
        }
    };

    // ── Completeness Meter ───────────────────────────────────
    const completeness = useMemo(() => {
        let filled = 0;
        const total = 8;
        if (form.title.trim()) filled++;
        if (form.shortDescription?.trim()) filled++;
        if (form.description) filled++;
        if (form.categoryId) filled++;
        if (form.price > 0) filled++;
        if (form.instructorId) filled++;
        if (thumbnailFile) filled++;
        if (form.courseType) filled++;
        return Math.round((filled / total) * 100);
    }, [form, thumbnailFile]);

    const inputClass = "w-full h-10 px-3 rounded-lg border border-gray-300 bg-white text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all";
    const labelClass = "block text-sm font-medium text-gray-700 mb-1.5";

    const actions = (
        <>
            <Link href="/admin/courses">
                <Button variant="ghost" disabled={saving} className="text-gray-600 hover:text-gray-900">
                    <ChevronLeft size={18} className="mr-2" /> ยกเลิก
                </Button>
            </Link>
            <Button onClick={handleSubmit} isLoading={saving} className="bg-primary hover:bg-primary-dark text-white shadow-md hover:shadow-lg transition-all">
                <Save size={18} className="mr-2" /> บันทึกคอร์ส
            </Button>
        </>
    );

    return (
        <AdminFormLayout
            title="สร้างคอร์สใหม่"
            description="กรอกข้อมูลคอร์สเพื่อเริ่มสอน คอร์สที่สร้างจะแสดงในหน้าค้นหาคอร์ส (รวมคอร์ส) อัตโนมัติ"
            breadcrumbs={[
                { label: 'แดชบอร์ด', href: '/admin' },
                { label: 'จัดการคอร์ส', href: '/admin/courses' },
                { label: 'สร้างคอร์สใหม่', href: '#' }
            ]}
            actions={actions}
        >
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
                                <label className={labelClass}>คำอธิบายสั้นๆ (แสดงหน้าคอร์ส) <span className="text-red-500">*</span></label>
                                <textarea 
                                    value={form.shortDescription || ""} 
                                    onChange={(e) => updateForm("shortDescription", e.target.value)} 
                                    placeholder="คำอธิบายสั้นๆ ที่จะแสดงในหน้าคอร์ส (ประมาณ 1-2 บรรทัด)…" 
                                    rows={3}
                                    className={inputClass}
                                />
                            </div>
                            <RichTextarea label="คำอธิบายเต็มๆ" value={form.description || ""} onChange={(val) => updateForm("description", val)} placeholder="รายละเอียดเนื้อหา สิ่งที่จะได้รับ…" rows={6} />
                        </div>
                    </SectionCard>

                    {/* ✅ ส่วนสื่อการสอนที่เพิ่มช่องใส่ไฟล์ MP4 / PDF */}
                    <SectionCard title="สื่อการสอน" icon={Video}>
                        <div className="space-y-4">
                            <ImageUpload label="ภาพปก (16:9)" value={thumbnailFile} onChange={setThumbnailFile} />
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                                <div>
                                    <label className={labelClass}>ลิงก์วิดีโอตัวอย่าง (MP4 / Youtube)</label>
                                    <div className="relative">
                                        <Monitor className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                        <input type="url" value={form.demoVideoUrl} onChange={(e) => updateForm("demoVideoUrl", e.target.value)} className={`${inputClass} pl-10`} placeholder="https://example.com/video.mp4" />
                                    </div>
                                </div>
                                <div>
                                    <label className={labelClass}>ไฟล์เอกสารประกอบ (ลิงก์ PDF)</label>
                                    <div className="relative">
                                        <File className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                        <input type="url" value={form.materialUrl} onChange={(e) => updateForm("materialUrl", e.target.value)} className={`${inputClass} pl-10`} placeholder="https://example.com/handout.pdf" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </SectionCard>

                    {/* ── หมวดหมู่และวิชา ── */}
                    <SectionCard title="หมวดหมู่และวิชา" icon={Folder}>
                        <div className="space-y-4">
                            {/* Quick Filters - 6 หมวดหมู่หลัก */}
                            <div>
                                <label className={labelClass}>หมวดหมู่หลัก <span className="text-red-500">*</span></label>
                                <div className="flex flex-wrap gap-2">
                                    {QUICK_FILTERS.map((filter) => (
                                        <button
                                            key={filter}
                                            type="button"
                                            onClick={() => handleQuickFilter(filter)}
                                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                                                activeQuickFilter === filter
                                                    ? 'bg-secondary text-white shadow-md'
                                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                            }`}
                                        >
                                            {filter}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            
                            {/* เลือกวิชา (Child Category) */}
                            {rootCategoryId && childCategories.length > 0 && (
                                <div>
                                    <label className={labelClass}>เลือกวิชา <span className="text-red-500">*</span></label>
                                    <select 
                                        value={form.categoryId || ""} 
                                        onChange={(e) => updateForm("categoryId", e.target.value || null)} 
                                        className={inputClass}
                                    >
                                        <option value="" disabled>-- เลือกวิชา --</option>
                                        {childCategories.map((cat) => (
                                            <option key={cat.id} value={cat.id}>
                                                {cat.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}
                            
                            {/* เลือกระดับชั้น */}
                            <div>
                                <label className={labelClass}>ระดับชั้น</label>
                                <select 
                                    value={form.levelId || ""} 
                                    onChange={(e) => updateForm("levelId", e.target.value || null)} 
                                    className={inputClass}
                                >
                                    <option value="">-- เลือกระดับชั้น --</option>
                                    {levels.map((lvl) => (
                                        <option key={lvl.id} value={lvl.id}>
                                            {lvl.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </SectionCard>

                    <SectionCard title="ผู้สอน" icon={User}>
                        <div>
                            <label className={labelClass}>เลือกผู้สอน <span className="text-red-500">*</span></label>
                            <select value={form.instructorId || ""} onChange={(e) => updateForm("instructorId", e.target.value || undefined)} className={inputClass}>
                                <option value="" disabled>-- เลือกผู้สอน --</option>
                                {instructors.map((inst) => (
                                    <option key={inst.id} value={inst.id}>
                                        {inst.name} {inst.nickname ? `(${inst.nickname})` : ''} 
                                    </option>
                                ))}
                            </select>
                        </div>
                    </SectionCard>

                    {/* Mobile: รูปแบบการสอน - แสดงก่อนตารางเรียน */}
                    <div className="lg:hidden">
                        <SectionCard title="รูปแบบการสอน" icon={BookOpen}>
                            <div className="space-y-2">
                                {([
                                    { value: "ONLINE", label: "Online (VDO)", icon: Monitor },
                                    { value: "ONLINE_LIVE", label: "Live (Zoom)", icon: Video },
                                    { value: "ONSITE", label: "Onsite", icon: MapPin }
                                ] as const).map((type) => {
                                    const IconComponent = type.icon;
                                    return (
                                        <button 
                                            key={type.value} 
                                            type="button" 
                                            onClick={() => updateForm("courseType", type.value)} 
                                            className={`w-full px-4 py-3 text-left rounded-lg transition-all border flex items-center gap-3 ${
                                                form.courseType === type.value 
                                                    ? "bg-primary/5 border-primary/30 ring-1 ring-primary/20" 
                                                    : "border-gray-200 hover:bg-gray-50 hover:border-gray-300"
                                            }`}
                                        >
                                            <IconComponent 
                                                size={18} 
                                                className={form.courseType === type.value ? "text-primary" : "text-gray-400"} 
                                            />
                                            <span className={`text-sm font-medium ${form.courseType === type.value ? "text-primary" : "text-gray-700"}`}>
                                                {type.label}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                            
                            {/* ตั้งค่าคอร์ส Online Live */}
                            {form.courseType === "ONLINE_LIVE" && (
                                <div className="mt-4 pt-4 border-t border-gray-100 space-y-4">
                                    <div>
                                        <label className={labelClass}>ลิงก์ Zoom/Google Meet</label>
                                        <input 
                                            type="url" 
                                            value={form.zoomLink || ""} 
                                            onChange={(e) => updateForm("zoomLink", e.target.value)} 
                                            placeholder="https://zoom.us/j/123456789 หรือ https://meet.google.com/xxx-yyyy-zzz" 
                                            className={inputClass} 
                                        />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Meeting ID <span className="text-gray-400 text-xs">(ไม่บังคับ)</span></label>
                                        <input 
                                            type="text" 
                                            value={form.meetingId || ""} 
                                            onChange={(e) => updateForm("meetingId", e.target.value)} 
                                            placeholder="123 456 7890" 
                                            className={inputClass} 
                                        />
                                    </div>
                                </div>
                            )}
                            
                            {/* ตั้งค่าคอร์ส Onsite - Google Map */}
                            {form.courseType === "ONSITE" && (
                                <div className="mt-4 pt-4 border-t border-gray-100 space-y-4">
                                    <div>
                                        <label className={labelClass}>สถานที่</label>
                                        <input 
                                            type="text" 
                                            value={form.location || ""} 
                                            onChange={(e) => updateForm("location", e.target.value)} 
                                            placeholder="เช่น สถาบัน Sigma Tutor สาขาสีลม" 
                                            className={inputClass} 
                                        />
                                    </div>
                                    <div>
                                        <label className={labelClass}>ลิงก์ Google Map</label>
                                        <input 
                                            type="url" 
                                            value={form.mapUrl || ""} 
                                            onChange={(e) => updateForm("mapUrl", e.target.value)} 
                                            placeholder="https://maps.google.com/?q=..." 
                                            className={inputClass} 
                                        />
                                    </div>
                                </div>
                            )}
                        </SectionCard>
                    </div>

                    <SectionCard title="ตารางเรียน" icon={CalendarDays}>
                        <ScheduleInput courseType={form.courseType as any} value={sessions} onChange={setSessions} />
                    </SectionCard>
                </div>

                <div className="space-y-6">
                    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-sm font-semibold text-gray-900 flex items-center gap-2"><Sparkles size={16} className="text-yellow-500" /> ความสมบูรณ์</span>
                            <span className={`text-sm font-bold ${completeness === 100 ? 'text-green-600' : 'text-gray-500'}`}>{completeness}%</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2.5">
                            <div className={`h-2.5 rounded-full transition-all duration-500 ${completeness === 100 ? 'bg-green-500' : completeness >= 60 ? 'bg-blue-500' : 'bg-orange-400'}`} style={{ width: `${completeness}%` }} />
                        </div>
                    </div>

                    <SectionCard title="ราคา" icon={DollarSign}>
                        <div className="space-y-4">
                            <div>
                                <label className={labelClass}>ช่วงราคา</label>
                                <select 
                                    value={form.priceRange || ""} 
                                    onChange={(e) => updateForm("priceRange", e.target.value || null)} 
                                    className={inputClass}
                                >
                                    <option value="">-- เลือกช่วงราคา --</option>
                                    <option value="under-1000">ต่ำกว่า 1,000 บาท</option>
                                    <option value="1000-3000">1,000 - 3,000 บาท</option>
                                    <option value="3000-5000">3,000 - 5,000 บาท</option>
                                    <option value="5000-10000">5,000 - 10,000 บาท</option>
                                    <option value="above-10000">มากกว่า 10,000 บาท</option>
                                </select>
                            </div>
                            <NumberInput label="ราคาตั้งต้น (บาท)" value={form.originalPrice || undefined} onChange={(val) => updateForm("originalPrice", val || null)} placeholder="ราคาเดิม" />
                            <NumberInput label="ราคาขาย (บาท) *" value={form.price} onChange={(val) => updateForm("price", val)} placeholder="0" />
                            <NumberInput label="ราคาโปรโมชั่น" value={form.promotionalPrice || undefined} onChange={(val) => updateForm("promotionalPrice", val || null)} placeholder="ราคาลด" />
                        </div>
                    </SectionCard>

                    {/* Desktop: รูปแบบการสอน - แสดงใน sidebar */}
                    <div className="hidden lg:block">
                        <SectionCard title="รูปแบบการสอน" icon={BookOpen}>
                            <div className="space-y-2">
                                {([
                                    { value: "ONLINE", label: "Online (VDO)", icon: Monitor },
                                    { value: "ONLINE_LIVE", label: "Live (Zoom)", icon: Video },
                                    { value: "ONSITE", label: "Onsite", icon: MapPin }
                                ] as const).map((type) => {
                                    const IconComponent = type.icon;
                                    return (
                                        <button 
                                            key={type.value} 
                                            type="button" 
                                            onClick={() => updateForm("courseType", type.value)} 
                                            className={`w-full px-4 py-3 text-left rounded-lg transition-all border flex items-center gap-3 ${
                                                form.courseType === type.value 
                                                    ? "bg-primary/5 border-primary/30 ring-1 ring-primary/20" 
                                                    : "border-gray-200 hover:bg-gray-50 hover:border-gray-300"
                                            }`}
                                        >
                                            <IconComponent 
                                                size={18} 
                                                className={form.courseType === type.value ? "text-primary" : "text-gray-400"} 
                                            />
                                            <span className={`text-sm font-medium ${form.courseType === type.value ? "text-primary" : "text-gray-700"}`}>
                                                {type.label}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        
                        {/* ตั้งค่าคอร์ส Online Live */}
                        {form.courseType === "ONLINE_LIVE" && (
                            <div className="mt-4 pt-4 border-t border-gray-100 space-y-4">
                                <div>
                                    <label className={labelClass}>ลิงก์ Zoom/Google Meet</label>
                                    <input 
                                        type="url" 
                                        value={form.zoomLink || ""} 
                                        onChange={(e) => updateForm("zoomLink", e.target.value)} 
                                        placeholder="https://zoom.us/j/123456789 หรือ https://meet.google.com/xxx-yyyy-zzz" 
                                        className={inputClass} 
                                    />
                                </div>
                                <div>
                                    <label className={labelClass}>Meeting ID <span className="text-gray-400 text-xs">(ไม่บังคับ)</span></label>
                                    <input 
                                        type="text" 
                                        value={form.meetingId || ""} 
                                        onChange={(e) => updateForm("meetingId", e.target.value)} 
                                        placeholder="123 456 7890" 
                                        className={inputClass} 
                                    />
                                </div>
                            </div>
                        )}
                        
                        {/* ตั้งค่าคอร์ส Onsite - Google Map */}
                        {form.courseType === "ONSITE" && (
                            <div className="mt-4 pt-4 border-t border-gray-100 space-y-4">
                                <div>
                                    <label className={labelClass}>สถานที่</label>
                                    <input 
                                        type="text" 
                                        value={form.location || ""} 
                                        onChange={(e) => updateForm("location", e.target.value)} 
                                        placeholder="เช่น สถาบัน Sigma Tutor สาขาสีลม" 
                                        className={inputClass} 
                                    />
                                </div>
                                <div>
                                    <label className={labelClass}>ลิงก์ Google Map</label>
                                    <input 
                                        type="url" 
                                        value={form.mapUrl || ""} 
                                        onChange={(e) => updateForm("mapUrl", e.target.value)} 
                                        placeholder="https://maps.google.com/?q=..." 
                                        className={inputClass} 
                                    />
                                </div>
                            </div>
                        )}
                        </SectionCard>
                    </div>
                    
                    {/* จำนวนที่นั่งที่สุด - เฉพาะ ONLINE_LIVE และ ONSITE */}
                    {(form.courseType === "ONLINE_LIVE" || form.courseType === "ONSITE") && (
                        <SectionCard title="การตั้งค่า" icon={Users}>
                            <div className="space-y-4">
                                <NumberInput 
                                    label="จำนวนที่นั่งที่สุด" 
                                    value={form.maxSeats || undefined} 
                                    onChange={(val) => updateForm("maxSeats", val || null)} 
                                    placeholder="เช่น 30" 
                                />
                            </div>
                        </SectionCard>
                    )}
                </div>
            </div>
        </AdminFormLayout>
    );
}