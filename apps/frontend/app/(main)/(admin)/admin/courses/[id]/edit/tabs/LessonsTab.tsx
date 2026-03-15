"use client";

import { useState, useEffect } from "react";
import {
    BookOpen, Plus, Trash2, ChevronDown, ChevronRight,
    GripVertical, Save, Loader2, Video, FileText, Lock, Unlock, Clock,
    Upload, CheckCircle2, X, File
} from "lucide-react";
import type { Course, Chapter, Lesson } from "@/app/lib/types";
import { useToast } from "@/app/components/ui/Toast";
import { Button } from "@/app/components/ui/Button";

interface LessonsTabProps {
    course: Course;
    onUpdate: () => void;
}

const API = "http://localhost:4000/api";

function getCredentials() {
    return { credentials: "include" as RequestCredentials };
}

function formatDuration(minutes: number): string {
    if (!minutes || minutes <= 0) return "";
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h > 0) return `${h} ชม. ${m > 0 ? `${m} นาที` : ""}`.trim();
    return `${m} นาที`;
}

function calcChapterDuration(lessons: Lesson[]): number {
    return lessons.reduce((sum, l) => sum + (l.duration || 0), 0);
}

function formatFileSize(bytes: number): string {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ── Lesson Form ──────────────────────────────────────────────────────────────

interface LessonFormProps {
    chapterId: string;
    lesson?: Lesson;
    onSave: (lesson: Lesson) => void;
    onCancel: () => void;
}

function LessonForm({ chapterId, lesson, onSave, onCancel }: LessonFormProps) {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        title: lesson?.title || "",
        type: lesson?.type || "VIDEO" as "VIDEO" | "FILE" | "QUIZ",
        duration: lesson?.duration?.toString() || "",
        isFree: lesson?.isFree || false,
        youtubeUrl: lesson?.youtubeUrl || "",
        gumletVideoId: lesson?.gumletVideoId || "",
        videoProvider: lesson?.videoProvider || "YOUTUBE" as "YOUTUBE" | "GUMLET",
        content: lesson?.content || "",
        materialUrl: (lesson as any)?.materialUrl || "",
    });

    // Video upload state
    const [videoUploading, setVideoUploading] = useState(false);
    const [videoProgress, setVideoProgress] = useState(0);
    const [videoFileName, setVideoFileName] = useState<string | null>(null);

    // PDF upload state
    const [pdfUploading, setPdfUploading] = useState(false);
    const [pdfProgress, setPdfProgress] = useState(0);
    const [pdfFileName, setPdfFileName] = useState<string | null>(
        lesson?.content ? lesson.content.split('/').pop() || null : null
    );

    const set = (key: string, value: unknown) => setForm(f => ({ ...f, [key]: value }));

    // ── Gumlet MP4 Upload ───────────────────────────────────────────────────
    async function handleVideoUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        e.target.value = "";
        if (!file || !file.type.startsWith("video/")) {
            toast.error("กรุณาเลือกไฟล์วิดีโอเท่านั้น");
            return;
        }
        setVideoUploading(true);
        setVideoProgress(0);
        setVideoFileName(file.name);
        try {
            // (1) ขอ upload URL จาก backend
            const urlRes = await fetch(`${API}/gumlet/upload-url`, {
                method: "POST",
                ...getCredentials(),
            });
            const urlData = await urlRes.json();
            if (!urlData.success || !urlData.upload_url) {
                toast.error(urlData.error || "ไม่สามารถสร้างลิงก์อัปโหลดได้");
                return;
            }
            const { upload_url, asset_id } = urlData;

            // (2) อัปโหลดตรงไปยัง Gumlet ด้วย XHR + progress
            await new Promise<void>((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                xhr.open("PUT", upload_url, true);
                xhr.setRequestHeader("Content-Type", file.type);
                xhr.upload.onprogress = (ev) => {
                    if (ev.lengthComputable) setVideoProgress(Math.round((ev.loaded / ev.total) * 100));
                };
                xhr.onload = () => {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        set("gumletVideoId", asset_id);
                        set("videoProvider", "GUMLET");
                        toast.success("อัปโหลดวิดีโอสำเร็จ! ระบบกำลัง Encode...");
                        resolve();
                    } else {
                        reject(new Error("Upload failed"));
                    }
                };
                xhr.onerror = () => reject(new Error("Network error"));
                xhr.send(file);
            });
        } catch {
            toast.error("อัปโหลดวิดีโอไม่สำเร็จ");
            setVideoFileName(null);
        } finally {
            setVideoUploading(false);
        }
    }

    // ── R2 PDF Upload ───────────────────────────────────────────────────────
    async function handlePdfUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        e.target.value = "";
        if (!file || file.type !== "application/pdf") {
            toast.error("กรุณาเลือกไฟล์ PDF เท่านั้น");
            return;
        }
        if (file.size > 50 * 1024 * 1024) {
            toast.error("ไฟล์ PDF ใหญ่เกิน 50MB");
            return;
        }
        setPdfUploading(true);
        setPdfProgress(0);
        setPdfFileName(file.name);

        const formData = new FormData();
        formData.append("file", file);

        await new Promise<void>((resolve) => {
            const xhr = new XMLHttpRequest();
            xhr.open("POST", `${API}/upload/lesson-material`, true);
            xhr.withCredentials = true;
            xhr.upload.onprogress = (ev) => {
                if (ev.lengthComputable) setPdfProgress(Math.round((ev.loaded / ev.total) * 100));
            };
            xhr.onload = () => {
                try {
                    const data = JSON.parse(xhr.responseText);
                    if (xhr.status === 200 && data.success) {
                        set("materialUrl", data.url);
                        set("content", data.url);
                        toast.success("อัปโหลด PDF สำเร็จ");
                    } else {
                        toast.error(data.error || "อัปโหลดไม่สำเร็จ");
                        setPdfFileName(null);
                    }
                } catch {
                    toast.error("เกิดข้อผิดพลาด");
                    setPdfFileName(null);
                }
                resolve();
            };
            xhr.onerror = () => { toast.error("เกิดข้อผิดพลาดในการเชื่อมต่อ"); setPdfFileName(null); resolve(); };
            xhr.send(formData);
        });
        setPdfUploading(false);
    }

    async function handleSave() {
        if (!form.title.trim()) {
            toast.error("กรุณากรอกชื่อหัวข้อ");
            return;
        }
        setLoading(true);
        try {
            const lessonData = {
                title: form.title.trim(),
                type: form.type,
                duration: form.duration ? parseInt(form.duration) : null,
                isFree: form.isFree,
                youtubeUrl: form.youtubeUrl || null,
                gumletVideoId: form.gumletVideoId || null,
                videoProvider: form.gumletVideoId ? "GUMLET" : form.videoProvider,
                content: form.content || null,
                materialUrl: form.materialUrl || null,
            };

            const url = lesson ? `${API}/lessons/${lesson.id}` : `${API}/lessons`;
            const method = lesson ? "PUT" : "POST";
            const body = lesson ? lessonData : { ...lessonData, chapterId };

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                ...getCredentials(),
                body: JSON.stringify(body),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "บันทึกไม่สำเร็จ");
            toast.success(lesson ? "แก้ไขหัวข้อสำเร็จ" : "เพิ่มหัวข้อสำเร็จ");
            onSave(data.data);
        } catch (e: unknown) {
            toast.error(e instanceof Error ? e.message : "เกิดข้อผิดพลาด");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="bg-gray-50 rounded-xl p-4 space-y-3 border border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-gray-600 mb-1">ชื่อหัวข้อ *</label>
                    <input
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                        value={form.title}
                        onChange={e => set("title", e.target.value)}
                        placeholder="เช่น 1.1 บทนำ"
                    />
                </div>
                <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">ประเภท</label>
                    <select
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none"
                        value={form.type}
                        onChange={e => set("type", e.target.value)}
                    >
                        <option value="VIDEO">วิดีโอ</option>
                        <option value="FILE">ไฟล์/เอกสาร</option>
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">ความยาว (นาที)</label>
                    <input
                        type="number"
                        min="0"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                        value={form.duration}
                        onChange={e => set("duration", e.target.value)}
                        placeholder="0"
                    />
                </div>

                {/* ─── VIDEO ─────────────────────────────────── */}
                {form.type === "VIDEO" && (
                    <>
                        {/* Gumlet upload */}
                        <div className="md:col-span-2">
                            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                                🎬 วิดีโอ (Gumlet)
                            </label>
                            {form.gumletVideoId && !videoUploading ? (
                                <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg text-sm">
                                    <CheckCircle2 size={16} className="text-green-600 shrink-0" />
                                    <span className="text-green-700 flex-1 truncate font-medium">
                                        {videoFileName || `ID: ${form.gumletVideoId}`}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => { set("gumletVideoId", ""); set("videoProvider", "YOUTUBE"); setVideoFileName(null); }}
                                        className="text-gray-400 hover:text-red-500"
                                    ><X size={14} /></button>
                                </div>
                            ) : videoUploading ? (
                                <div className="space-y-1.5">
                                    <div className="flex justify-between text-xs text-gray-500">
                                        <span className="truncate max-w-[200px]">{videoFileName}</span>
                                        <span className="font-semibold">{videoProgress}%</span>
                                    </div>
                                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-linear-to-r from-primary to-blue-400 rounded-full transition-all duration-300"
                                            style={{ width: `${videoProgress}%` }}
                                        />
                                    </div>
                                    <p className="text-xs text-gray-400">กำลังอัปโหลด...</p>
                                </div>
                            ) : (
                                <div className="flex gap-2">
                                    <input
                                        className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                                        value={form.gumletVideoId}
                                        onChange={e => { set("gumletVideoId", e.target.value); if (e.target.value) set("videoProvider", "GUMLET"); }}
                                        placeholder="กรอก Gumlet Video ID..."
                                    />
                                    <label className="relative shrink-0">
                                        <input
                                            type="file"
                                            accept="video/mp4,video/*"
                                            onChange={handleVideoUpload}
                                            className="absolute inset-0 opacity-0 cursor-pointer"
                                            disabled={videoUploading}
                                        />
                                        <span className="flex items-center gap-1.5 px-3 py-2 bg-primary/10 text-primary text-sm font-medium rounded-lg hover:bg-primary/20 cursor-pointer transition-colors whitespace-nowrap">
                                            <Upload size={14} /> อัปโหลด MP4
                                        </span>
                                    </label>
                                </div>
                            )}
                        </div>

                        {/* YouTube URL */}
                        <div className="md:col-span-2">
                            <label className="block text-xs font-semibold text-gray-600 mb-1">YouTube URL (ทางเลือก)</label>
                            <input
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                                value={form.youtubeUrl}
                                onChange={e => set("youtubeUrl", e.target.value)}
                                placeholder="https://youtube.com/watch?v=..."
                            />
                        </div>
                    </>
                )}

                {/* ─── FILE ──────────────────────────────────── */}
                {form.type === "FILE" && (
                    <div className="md:col-span-2">
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                            📄 ไฟล์ PDF
                        </label>
                        {form.materialUrl && !pdfUploading ? (
                            <div className="flex items-center gap-2 px-3 py-2 bg-orange-50 border border-orange-200 rounded-lg text-sm">
                                <File size={15} className="text-orange-500 shrink-0" />
                                <span className="text-orange-700 flex-1 truncate font-medium">
                                    {pdfFileName || "ไฟล์ PDF"}
                                </span>
                                <a href={form.materialUrl} target="_blank" rel="noreferrer"
                                    className="text-xs text-blue-500 hover:underline shrink-0">ดู</a>
                                <button
                                    type="button"
                                    onClick={() => { set("materialUrl", ""); set("content", ""); setPdfFileName(null); }}
                                    className="text-gray-400 hover:text-red-500"
                                ><X size={14} /></button>
                            </div>
                        ) : pdfUploading ? (
                            <div className="space-y-1.5">
                                <div className="flex justify-between text-xs text-gray-500">
                                    <span className="truncate max-w-[200px]">{pdfFileName}</span>
                                    <span className="font-semibold">{pdfProgress}%</span>
                                </div>
                                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-orange-400 to-orange-300 rounded-full transition-all duration-300"
                                        style={{ width: `${pdfProgress}%` }}
                                    />
                                </div>
                                <p className="text-xs text-gray-400">กำลังอัปโหลด PDF...</p>
                            </div>
                        ) : (
                            <div className="flex gap-2">
                                <input
                                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                                    value={form.content}
                                    onChange={e => { set("content", e.target.value); set("materialUrl", e.target.value); }}
                                    placeholder="https://... หรืออัปโหลดไฟล์ →"
                                />
                                <label className="relative shrink-0">
                                    <input
                                        type="file"
                                        accept="application/pdf"
                                        onChange={handlePdfUpload}
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                        disabled={pdfUploading}
                                    />
                                    <span className="flex items-center gap-1.5 px-3 py-2 bg-orange-50 text-orange-600 text-sm font-medium rounded-lg hover:bg-orange-100 cursor-pointer transition-colors whitespace-nowrap border border-orange-200">
                                        <Upload size={14} /> อัปโหลด PDF
                                    </span>
                                </label>
                            </div>
                        )}
                        <p className="text-[11px] text-gray-400 mt-1">รองรับ .pdf ขนาดไม่เกิน 50MB</p>
                    </div>
                )}
            </div>
            <div className="flex items-center gap-2">
                <button
                    type="button"
                    onClick={() => set("isFree", !form.isFree)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${form.isFree
                            ? "bg-green-50 border-green-300 text-green-700"
                            : "bg-gray-100 border-gray-300 text-gray-500"
                        }`}
                >
                    {form.isFree ? <Unlock size={13} /> : <Lock size={13} />}
                    {form.isFree ? "ทดลองเรียนฟรี" : "ต้องชำระเงิน"}
                </button>
            </div>
            <div className="flex justify-end gap-2 pt-1">
                <Button variant="outline" size="sm" onClick={onCancel} disabled={loading || videoUploading || pdfUploading}>ยกเลิก</Button>
                <Button size="sm" onClick={handleSave} disabled={loading || videoUploading || pdfUploading}>
                    {loading ? <Loader2 size={14} className="animate-spin mr-1" /> : <Save size={14} className="mr-1" />}
                    บันทึก
                </Button>
            </div>
        </div>
    );
}

// ── Chapter Section ──────────────────────────────────────────────────────────

interface ChapterSectionProps {
    chapter: Chapter;
    courseId: string;
    onChapterUpdated: (chapter: Chapter) => void;
    onChapterDeleted: (id: string) => void;
}

function ChapterSection({ chapter, courseId, onChapterUpdated, onChapterDeleted }: ChapterSectionProps) {
    const { toast } = useToast();
    const [expanded, setExpanded] = useState(true);
    const [editingTitle, setEditingTitle] = useState(false);
    const [titleInput, setTitleInput] = useState(chapter.title);
    const [lessons, setLessons] = useState<Lesson[]>(chapter.lessons || []);
    const [addingLesson, setAddingLesson] = useState(false);
    const [editingLesson, setEditingLesson] = useState<string | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [savingTitle, setSavingTitle] = useState(false);

    const chapterDuration = calcChapterDuration(lessons);
    const videoCount = lessons.filter(l => l.type === "VIDEO").length;

    async function saveTitle() {
        if (!titleInput.trim()) return;
        setSavingTitle(true);
        try {
            const res = await fetch(`${API}/chapters/${chapter.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                ...getCredentials(),
                body: JSON.stringify({ title: titleInput.trim() }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "แก้ไขไม่สำเร็จ");
            onChapterUpdated({ ...chapter, title: titleInput.trim(), lessons });
            setEditingTitle(false);
            toast.success("แก้ไขชื่อบทเรียนสำเร็จ");
        } catch (e: unknown) {
            toast.error(e instanceof Error ? e.message : "เกิดข้อผิดพลาด");
        } finally {
            setSavingTitle(false);
        }
    }

    async function deleteChapter() {
        if (!confirm(`ลบบทเรียน "${chapter.title}" และหัวข้อทั้งหมดในบทนี้?`)) return;
        setDeleting(true);
        try {
            const res = await fetch(`${API}/chapters/${chapter.id}`, {
                method: "DELETE",
                ...getCredentials(),
            });
            if (!res.ok) throw new Error("ลบไม่สำเร็จ");
            onChapterDeleted(chapter.id);
            toast.success("ลบบทเรียนสำเร็จ");
        } catch (e: unknown) {
            toast.error(e instanceof Error ? e.message : "เกิดข้อผิดพลาด");
        } finally {
            setDeleting(false);
        }
    }

    async function deleteLesson(lessonId: string) {
        if (!confirm("ลบหัวข้อนี้?")) return;
        try {
            const res = await fetch(`${API}/lessons/${lessonId}`, {
                method: "DELETE",
                ...getCredentials(),
            });
            if (!res.ok) throw new Error("ลบไม่สำเร็จ");
            const updated = lessons.filter(l => l.id !== lessonId);
            setLessons(updated);
            onChapterUpdated({ ...chapter, lessons: updated });
            toast.success("ลบหัวข้อสำเร็จ");
        } catch (e: unknown) {
            toast.error(e instanceof Error ? e.message : "เกิดข้อผิดพลาด");
        }
    }

    function handleLessonSaved(saved: Lesson) {
        let updated: Lesson[];
        if (editingLesson) {
            updated = lessons.map(l => l.id === saved.id ? saved : l);
        } else {
            updated = [...lessons, saved];
        }
        setLessons(updated);
        onChapterUpdated({ ...chapter, lessons: updated });
        setAddingLesson(false);
        setEditingLesson(null);
    }

    return (
        <div className="border border-gray-200 rounded-xl overflow-hidden">
            {/* Chapter header */}
            <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 border-b border-gray-200">
                <GripVertical size={16} className="text-gray-400 cursor-grab shrink-0" />
                <button
                    type="button"
                    onClick={() => setExpanded(e => !e)}
                    className="flex items-center gap-2 flex-1 text-left"
                >
                    {expanded ? <ChevronDown size={16} className="text-gray-500 shrink-0" /> : <ChevronRight size={16} className="text-gray-500 shrink-0" />}
                    {editingTitle ? (
                        <input
                            autoFocus
                            className="border border-primary rounded px-2 py-0.5 text-sm font-semibold w-full max-w-xs"
                            value={titleInput}
                            onChange={e => setTitleInput(e.target.value)}
                            onBlur={saveTitle}
                            onKeyDown={e => { if (e.key === "Enter") saveTitle(); if (e.key === "Escape") { setEditingTitle(false); setTitleInput(chapter.title); } }}
                            onClick={e => e.stopPropagation()}
                        />
                    ) : (
                        <span className="font-semibold text-gray-800 text-sm">{chapter.title}</span>
                    )}
                </button>
                <div className="flex items-center gap-3 text-xs text-gray-400 shrink-0">
                    {videoCount > 0 && <span className="flex items-center gap-1"><Video size={12} /> {videoCount} วิดีโอ</span>}
                    {chapterDuration > 0 && <span className="flex items-center gap-1"><Clock size={12} /> {formatDuration(chapterDuration)}</span>}
                </div>
                <div className="flex gap-1 shrink-0">
                    {savingTitle && <Loader2 size={14} className="animate-spin text-primary" />}
                    <button
                        type="button"
                        onClick={e => { e.stopPropagation(); setEditingTitle(true); setExpanded(true); }}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-primary hover:bg-primary/10 text-xs"
                    >
                        แก้ไข
                    </button>
                    <button
                        type="button"
                        onClick={deleteChapter}
                        disabled={deleting}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50"
                    >
                        {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                    </button>
                </div>
            </div>

            {/* Lessons */}
            {expanded && (
                <div className="p-3 space-y-2">
                    {lessons.map(lesson => (
                        <div key={lesson.id}>
                            {editingLesson === lesson.id ? (
                                <LessonForm
                                    chapterId={chapter.id}
                                    lesson={lesson}
                                    onSave={handleLessonSaved}
                                    onCancel={() => setEditingLesson(null)}
                                />
                            ) : (
                                <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-white border border-gray-100 hover:border-gray-200 group">
                                    <GripVertical size={14} className="text-gray-300 cursor-grab shrink-0" />
                                    <div className="flex items-center gap-1.5 shrink-0">
                                        {lesson.type === "VIDEO" ? (
                                            <Video size={14} className="text-primary" />
                                        ) : (
                                            <FileText size={14} className="text-orange-500" />
                                        )}
                                    </div>
                                    <span className="text-sm text-gray-700 flex-1 truncate">{lesson.title}</span>
                                    <div className="flex items-center gap-2 shrink-0">
                                        {lesson.isFree && (
                                            <span className="text-[10px] font-semibold bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">ฟรี</span>
                                        )}
                                        {lesson.duration && lesson.duration > 0 && (
                                            <span className="text-xs text-gray-400 flex items-center gap-1">
                                                <Clock size={11} /> {lesson.duration} นาที
                                            </span>
                                        )}
                                        <button
                                            type="button"
                                            onClick={() => setEditingLesson(lesson.id)}
                                            className="opacity-0 group-hover:opacity-100 text-xs text-gray-400 hover:text-primary px-2 py-1 rounded"
                                        >
                                            แก้ไข
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => deleteLesson(lesson.id)}
                                            className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 p-1 rounded"
                                        >
                                            <Trash2 size={13} />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}

                    {addingLesson ? (
                        <LessonForm
                            chapterId={chapter.id}
                            onSave={handleLessonSaved}
                            onCancel={() => setAddingLesson(false)}
                        />
                    ) : (
                        <button
                            type="button"
                            onClick={() => setAddingLesson(true)}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-400 hover:text-primary hover:bg-primary/5 rounded-lg border border-dashed border-gray-200 hover:border-primary/40 transition-colors"
                        >
                            <Plus size={14} /> เพิ่มหัวข้อ
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}

// ── Main LessonsTab ──────────────────────────────────────────────────────────

export function LessonsTab({ course, onUpdate }: LessonsTabProps) {
    const { toast } = useToast();
    const [chapters, setChapters] = useState<Chapter[]>([]);
    const [addingChapter, setAddingChapter] = useState(false);
    const [newChapterTitle, setNewChapterTitle] = useState("");
    const [creatingChapter, setCreatingChapter] = useState(false);
    const [loading, setLoading] = useState(true);

    // Fetch chapters with lessons on mount
    useEffect(() => {
        async function fetchChapters() {
            setLoading(true);
            try {
                const res = await fetch(`${API}/courses/${course.id}`, getCredentials());
                const data = await res.json();
                if (data.success && data.data?.chapters) {
                    setChapters(data.data.chapters);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        }
        fetchChapters();
    }, [course.id]);

    const totalMinutes = chapters.reduce((sum, ch) => sum + calcChapterDuration(ch.lessons || []), 0);
    const totalVideos = chapters.reduce((sum, ch) => sum + (ch.lessons || []).filter(l => l.type === "VIDEO").length, 0);

    async function createChapter() {
        if (!newChapterTitle.trim()) {
            toast.error("กรุณากรอกชื่อบทเรียน");
            return;
        }
        setCreatingChapter(true);
        try {
            const res = await fetch(`${API}/chapters`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                ...getCredentials(),
                body: JSON.stringify({ title: newChapterTitle.trim(), courseId: course.id }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "สร้างบทเรียนไม่สำเร็จ");
            setChapters(prev => [...prev, { ...data.data, lessons: [] }]);
            setNewChapterTitle("");
            setAddingChapter(false);
            toast.success("เพิ่มบทเรียนสำเร็จ");
            onUpdate();
        } catch (e: unknown) {
            toast.error(e instanceof Error ? e.message : "เกิดข้อผิดพลาด");
        } finally {
            setCreatingChapter(false);
        }
    }

    function handleChapterUpdated(updated: Chapter) {
        setChapters(prev => prev.map(ch => ch.id === updated.id ? updated : ch));
        onUpdate();
    }

    function handleChapterDeleted(id: string) {
        setChapters(prev => prev.filter(ch => ch.id !== id));
        onUpdate();
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-16 bg-white rounded-xl border shadow-sm">
                <Loader2 className="animate-spin text-primary mr-2" size={24} />
                <span className="text-gray-500">กำลังโหลดบทเรียน...</span>
            </div>
        );
    }

    return (
        <div className="space-y-6 bg-white p-6 rounded-xl border shadow-sm">
            {/* Header */}
            <div className="flex justify-between items-start pb-5 border-b">
                <div>
                    <h2 className="text-2xl font-black text-gray-900 flex items-center gap-3">
                        <BookOpen className="text-primary" size={28} /> จัดการเนื้อหาบทเรียน
                    </h2>
                    {(totalVideos > 0 || totalMinutes > 0) && (
                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                            {totalVideos > 0 && <span className="flex items-center gap-1"><Video size={14} /> {totalVideos} วิดีโอ</span>}
                            {totalMinutes > 0 && <span className="flex items-center gap-1"><Clock size={14} /> รวม {formatDuration(totalMinutes)}</span>}
                        </div>
                    )}
                </div>
            </div>

            {/* Chapter list */}
            <div className="space-y-3">
                {chapters.length === 0 && !addingChapter && (
                    <div className="text-center py-12 text-gray-400">
                        <BookOpen size={40} className="mx-auto mb-3 opacity-30" />
                        <p className="text-sm">ยังไม่มีบทเรียน กดปุ่มด้านล่างเพื่อเพิ่มบทเรียนแรก</p>
                    </div>
                )}

                {chapters.map(chapter => (
                    <ChapterSection
                        key={chapter.id}
                        chapter={chapter}
                        courseId={course.id}
                        onChapterUpdated={handleChapterUpdated}
                        onChapterDeleted={handleChapterDeleted}
                    />
                ))}
            </div>

            {/* Add chapter */}
            {addingChapter ? (
                <div className="flex items-center gap-3 p-4 border border-primary/30 rounded-xl bg-primary/5">
                    <input
                        autoFocus
                        className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                        placeholder="ชื่อบทเรียน เช่น บทที่ 1: บทนำ"
                        value={newChapterTitle}
                        onChange={e => setNewChapterTitle(e.target.value)}
                        onKeyDown={e => { if (e.key === "Enter") createChapter(); if (e.key === "Escape") { setAddingChapter(false); setNewChapterTitle(""); } }}
                    />
                    <Button size="sm" onClick={createChapter} disabled={creatingChapter}>
                        {creatingChapter ? <Loader2 size={14} className="animate-spin" /> : "เพิ่ม"}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => { setAddingChapter(false); setNewChapterTitle(""); }}>
                        ยกเลิก
                    </Button>
                </div>
            ) : (
                <button
                    type="button"
                    onClick={() => setAddingChapter(true)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-primary border-2 border-dashed border-primary/30 hover:border-primary/60 hover:bg-primary/5 rounded-xl transition-colors"
                >
                    <Plus size={16} /> เพิ่มบทเรียนใหม่
                </button>
            )}
        </div>
    );
}
