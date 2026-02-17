
"use client";

import { useState, useEffect } from "react";
import { FileText, Video, Users, Monitor, MapPin, Folder, DollarSign, Globe, Save } from "lucide-react";
import { courseApi, categoryApi, levelApi } from "@/app/lib/api";
import type { Category, Level, Course, CreateCourseInput } from "@/app/lib/types";
import { useToast } from "@/app/components/ui/Toast";
import { SectionCard } from "@/app/components/ui/SectionCard";
import { NumberInput } from "@/app/components/ui/NumberInput";
import { RichTextarea } from "@/app/components/ui/RichTextarea";
import { ImageUpload } from "@/app/components/ui/ImageUpload";
import { Button } from "@/app/components/ui/Button";

interface CourseOverviewTabProps {
    course: Course;
    onUpdate: () => void;
}

export function CourseOverviewTab({ course, onUpdate }: CourseOverviewTabProps) {
    const { toast } = useToast();
    const [categories, setCategories] = useState<Category[]>([]);
    const [levels, setLevels] = useState<Level[]>([]);

    useEffect(() => {
        categoryApi.list().then((r) => { if (r.success && r.data) setCategories(r.data); });
        levelApi.list().then((r) => { if (r.success && r.data) setLevels(r.data); });
    }, []);

    const [form, setForm] = useState<CreateCourseInput>({
        title: course.title,
        description: course.description,
        price: course.price,
        originalPrice: course.originalPrice,
        courseType: course.type as any, // Enum casing might differ? type is CourseType.
        categoryId: course.categoryId,
        levelId: course.levelId,
        duration: course.duration,
        videoCount: course.videoCount,
        maxSeats: course.maxSeats,
        enrollStartDate: course.enrollStartDate,
        enrollEndDate: course.enrollEndDate,
        location: course.location,
        mapUrl: course.mapUrl,
        zoomLink: course.zoomLink,
        published: course.published,
    });

    const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
    const [saving, setSaving] = useState(false);

    const updateForm = <K extends keyof CreateCourseInput>(key: K, value: CreateCourseInput[K]) => {
        setForm((prev) => ({ ...prev, [key]: value }));
    };

    const handleSave = async () => {
        setSaving(true);
        if (!form.title.trim()) {
            toast.error("กรุณากรอกชื่อคอร์ส");
            setSaving(false);
            return;
        }

        // Update Text Data
        const res = await courseApi.update(course.id, form);
        if (!res.success) {
            toast.error(res.error || "บันทึกไม่สำเร็จ");
            setSaving(false);
            return;
        }

        // Upload Thumbnail if changed
        if (thumbnailFile) {
            await courseApi.uploadThumbnail(course.id, thumbnailFile);
        }

        toast.success("บันทึกข้อมูลเรียบร้อย");
        setSaving(false);
        onUpdate();
    };

    // Shared Styles
    const inputClass = "w-full h-10 px-3 rounded-lg border border-gray-300 bg-white text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all";
    const labelClass = "block text-sm font-medium text-gray-700 mb-1.5";

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-6">
                <SectionCard title="ข้อมูลทั่วไป" icon={FileText}>
                    <div className="space-y-4">
                        <div>
                            <label className={labelClass}>ชื่อคอร์ส *</label>
                            <input
                                type="text"
                                value={form.title}
                                onChange={(e) => updateForm("title", e.target.value)}
                                className={inputClass}
                            />
                        </div>
                        <RichTextarea
                            label="คำอธิบายคอร์ส"
                            value={form.description || ""}
                            onChange={(val) => updateForm("description", val)}
                            rows={6}
                        />
                    </div>
                </SectionCard>

                <SectionCard title="สื่อการสอน" icon={Video}>
                    <div className="space-y-4">
                        <ImageUpload
                            label="ภาพปก (16:9)"
                            value={thumbnailFile || course.thumbnail} // Show existing URL if no new file
                            onChange={setThumbnailFile}
                        />
                    </div>
                </SectionCard>

                {(form.courseType === "ONLINE_LIVE" || form.courseType === "ONSITE") && (
                    <SectionCard title="การรับสมัคร" icon={Users}>
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
                {form.courseType === "ONLINE_LIVE" && (
                    <SectionCard title="ช่องทางเรียนสด" icon={Monitor}>
                        <div>
                            <label className={labelClass}>Zoom Link</label>
                            <input
                                type="url"
                                value={form.zoomLink || ""}
                                onChange={(e) => updateForm("zoomLink", e.target.value)}
                                className={inputClass}
                            />
                        </div>
                    </SectionCard>
                )}
                {form.courseType === "ONSITE" && (
                    <SectionCard title="สถานที่เรียน" icon={MapPin}>
                        <div className="space-y-4">
                            <div>
                                <label className={labelClass}>สถานที่</label>
                                <input
                                    type="text"
                                    value={form.location || ""}
                                    onChange={(e) => updateForm("location", e.target.value)}
                                    className={inputClass}
                                />
                            </div>
                            <div>
                                <label className={labelClass}>Google Map URL</label>
                                <input
                                    type="url"
                                    value={form.mapUrl || ""}
                                    onChange={(e) => updateForm("mapUrl", e.target.value)}
                                    className={inputClass}
                                />
                            </div>
                        </div>
                    </SectionCard>
                )}
            </div>

            {/* Right Column */}
            <div className="space-y-6">
                {/* Action Panel (Sticky) */}
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm sticky top-24 z-10">
                    <div className="flex items-center justify-between mb-4">
                        <span className="font-semibold text-gray-900">บันทึกการแก้ไข</span>
                    </div>
                    <Button
                        onClick={handleSave}
                        isLoading={saving}
                        fullWidth
                        size="lg"
                    >
                        <Save size={18} className="mr-2" />
                        บันทึกข้อมูล
                    </Button>
                </div>

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
                </SectionCard>

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
                <SectionCard title="ราคา" icon={DollarSign}>
                    <div className="space-y-4">
                        <NumberInput
                            label="ราคาขาย (บาท) *"
                            value={form.price}
                            onChange={(val) => updateForm("price", val)}
                        />
                        <NumberInput
                            label="ราคาเต็ม"
                            value={form.originalPrice || undefined}
                            onChange={(val) => updateForm("originalPrice", val || null)}
                        />
                    </div>
                </SectionCard>
            </div>
        </div>
    );
}
