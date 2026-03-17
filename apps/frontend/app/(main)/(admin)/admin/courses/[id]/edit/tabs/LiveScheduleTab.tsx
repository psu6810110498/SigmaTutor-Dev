"use client";

import { useState, useEffect } from "react";
import { Save, Loader2, CalendarDays, Plus, Trash2, Video, Link, Upload, File, X, CheckCircle2 } from "lucide-react";
import type { Course, CourseSchedule } from "@/app/lib/types";
import { useToast } from "@/app/components/ui/Toast";
import { Button } from "@/app/components/ui/Button";

interface LiveScheduleTabProps {
    course: Course;
    onUpdate: () => void;
}

interface LiveSession {
    id?: string;
    sessionNumber: number;
    topic: string;
    date: string;
    startTime: string;
    endTime: string;
    zoomLink: string;
    // Replay video (ย้อนหลัง)
    gumletVideoId: string;
    videoUrl: string;
    videoProvider: "YOUTUBE" | "GUMLET";
    // PDF material
    materialUrl: string;
    content: string;
}

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";
const CREDS: RequestInit = { credentials: "include" };

function toDateInput(iso: string | null | undefined): string {
    if (!iso) return "";
    try { return new Date(iso).toISOString().split("T")[0]; } catch { return ""; }
}

function toTimeInput(iso: string | null | undefined): string {
    if (!iso) return "";
    try {
        const d = new Date(iso);
        return d.toTimeString().slice(0, 5);
    } catch { return ""; }
}

function combineDatetime(date: string, time: string): string | null {
    if (!date || !time) return null;
    return new Date(`${date}T${time}:00`).toISOString();
}

function emptySession(sessionNumber: number): LiveSession {
    return {
        sessionNumber,
        topic: "",
        date: "",
        startTime: "",
        endTime: "",
        zoomLink: "",
        gumletVideoId: "",
        videoUrl: "",
        videoProvider: "YOUTUBE",
        materialUrl: "",
        content: "",
    };
}

export function LiveScheduleTab({ course, onUpdate }: LiveScheduleTabProps) {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [sessions, setSessions] = useState<LiveSession[]>([]);
    const [videoSourceToggle, setVideoSourceToggle] = useState<Record<number, "YOUTUBE" | "GUMLET">>({});
    // PDF upload state per session index
    const [pdfUploading, setPdfUploading] = useState<Record<number, boolean>>({});
    const [pdfProgress, setPdfProgress] = useState<Record<number, number>>({});
    const [pdfFileName, setPdfFileName] = useState<Record<number, string | null>>({});
    const [isInitialized, setIsInitialized] = useState(false);

    // Upload state tracking
    const [uploading, setUploading] = useState<Record<number, boolean>>({});
    const [progress, setProgress] = useState<Record<number, number>>({});
    const [fileName, setFileName] = useState<Record<number, string>>({});

    useEffect(() => {
        if (isInitialized) return;
        if (course.schedules && course.schedules.length > 0) {
            const mapped = course.schedules.map((s, i) => ({
                id: s.id,
                sessionNumber: s.sessionNumber ?? (i + 1),
                topic: s.topic || "",
                date: toDateInput(s.date),
                startTime: toTimeInput(s.startTime),
                endTime: toTimeInput(s.endTime),
                zoomLink: s.zoomLink || "",
                gumletVideoId: s.gumletVideoId || "",
                videoUrl: s.videoUrl || "",
                videoProvider: (s.videoProvider as "YOUTUBE" | "GUMLET") || "YOUTUBE",
                materialUrl: (s as any).materialUrl || "",
                content: (s as any).content || "",
            }));
            setSessions(mapped);
            // Initialize video source toggles from data
            const toggles: Record<number, "YOUTUBE" | "GUMLET"> = {};
            mapped.forEach((s, i) => { toggles[i] = s.gumletVideoId ? "GUMLET" : "YOUTUBE"; });
            setVideoSourceToggle(toggles);
            // Initialize PDF file names
            const names: Record<number, string | null> = {};
            mapped.forEach((s, i) => { names[i] = s.materialUrl ? s.materialUrl.split('/').pop() || null : null; });
            setPdfFileName(names);
            setIsInitialized(true);
        } else {
            setSessions([emptySession(1)]);
            setIsInitialized(true);
        }
    }, [course, isInitialized]);

    function updateSession(index: number, key: keyof LiveSession, value: string | number) {
        setSessions(prev => prev.map((s, i) => i === index ? { ...s, [key]: value } : s));
    }

    function addSession() {
        setSessions(prev => [...prev, emptySession(prev.length + 1)]);
    }

    function removeSession(index: number) {
        if (sessions.length === 1) { toast.error("ต้องมีอย่างน้อย 1 ครั้ง"); return; }
        setSessions(prev => prev.filter((_, i) => i !== index).map((s, i) => ({ ...s, sessionNumber: i + 1 })));
    }

    async function handleVideoUpload(index: number, e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        e.target.value = "";
        if (!file || !file.type.startsWith("video/")) {
            toast.error("กรุณาเลือกไฟล์วิดีโอเท่านั้น");
            return;
        }

        setUploading(prev => ({ ...prev, [index]: true }));
        setProgress(prev => ({ ...prev, [index]: 0 }));
        setFileName(prev => ({ ...prev, [index]: file.name }));

        try {
            // (1) ขอ upload URL จาก backend
            const urlRes = await fetch(`${API}/gumlet/upload-url`, {
                method: "POST",
                ...CREDS,
            });
            const urlData = await urlRes.json();
            if (!urlData.success || !urlData.upload_url) {
                toast.error(urlData.error || "ไม่สามารถสร้างลิงก์อัปโหลดได้");
                setUploading(prev => ({ ...prev, [index]: false }));
                return;
            }
            const { upload_url, asset_id } = urlData;

            // (2) อัปโหลดตรงไปยัง Gumlet ด้วย XHR + progress
            await new Promise<void>((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                xhr.open("PUT", upload_url, true);
                xhr.setRequestHeader("Content-Type", file.type);
                xhr.upload.onprogress = (ev) => {
                    if (ev.lengthComputable) {
                        setProgress(prev => ({ ...prev, [index]: Math.round((ev.loaded / ev.total) * 100) }));
                    }
                };
                xhr.onload = () => {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        updateSession(index, "gumletVideoId", asset_id);
                        updateSession(index, "videoProvider", "GUMLET");
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
            setFileName(prev => ({ ...prev, [index]: "" }));
        } finally {
            setUploading(prev => ({ ...prev, [index]: false }));
        }
    }

    // ── R2 PDF Upload (per session) ─────────────────────────────────────
    async function handlePdfUpload(index: number, e: React.ChangeEvent<HTMLInputElement>) {
        e.preventDefault();
        e.stopPropagation();
        const file = e.target.files?.[0];
        if (!file || file.type !== "application/pdf") {
            toast.error("กรุณาเลือกไฟล์ PDF เท่านั้น");
            return;
        }
        if (file.size > 50 * 1024 * 1024) {
            toast.error("ไฟล์ PDF ใหญ่เกิน 50MB");
            return;
        }
        setPdfUploading(prev => ({ ...prev, [index]: true }));
        setPdfProgress(prev => ({ ...prev, [index]: 0 }));
        setPdfFileName(prev => ({ ...prev, [index]: file.name }));

        const formData = new FormData();
        formData.append("file", file);

        await new Promise<void>((resolve) => {
            const xhr = new XMLHttpRequest();
            xhr.open("POST", `${API}/upload/lesson-material`, true);
            xhr.withCredentials = true;
            xhr.upload.onprogress = (ev) => {
                if (ev.lengthComputable) setPdfProgress(prev => ({ ...prev, [index]: Math.round((ev.loaded / ev.total) * 100) }));
            };
            xhr.onload = () => {
                try {
                    const data = JSON.parse(xhr.responseText);
                    if (xhr.status === 200 && data.success) {
                        updateSession(index, "materialUrl", data.url);
                        updateSession(index, "content", data.url);
                        toast.success("อัปโหลด PDF สำเร็จ");
                    } else {
                        toast.error(data.error || "อัปโหลดไม่สำเร็จ");
                        setPdfFileName(prev => ({ ...prev, [index]: null }));
                    }
                } catch {
                    toast.error("เกิดข้อผิดพลาด");
                    setPdfFileName(prev => ({ ...prev, [index]: null }));
                }
                resolve();
            };
            xhr.onerror = () => { toast.error("เกิดข้อผิดพลาดในการเชื่อมต่อ"); setPdfFileName(prev => ({ ...prev, [index]: null })); resolve(); };
            xhr.send(formData);
        });
        setPdfUploading(prev => ({ ...prev, [index]: false }));
    }

    async function handleSave() {
        setLoading(true);
        try {
            const payload = sessions.map(s => ({
                sessionNumber: s.sessionNumber,
                topic: s.topic || `ครั้งที่ ${s.sessionNumber}`,
                date: combineDatetime(s.date, "00:00"),
                startTime: combineDatetime(s.date, s.startTime || "00:00"),
                endTime: combineDatetime(s.date, s.endTime || "00:00"),
                zoomLink: s.zoomLink || null,
                isOnline: true,
                gumletVideoId: s.gumletVideoId || null,
                videoUrl: s.videoUrl || null,
                videoProvider: s.gumletVideoId ? "GUMLET" : "YOUTUBE",
                materialUrl: s.materialUrl || null,
                content: s.content || null,
                status: "ON_SCHEDULE",
            }));

            const res = await fetch(`${API}/schedules/sync/${course.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                ...CREDS,
                body: JSON.stringify({ sessions: payload }),
            });
            const data = await res.json();
            if (!res.ok || !data.success) throw new Error(data.error || "บันทึกไม่สำเร็จ");
            toast.success("บันทึกตารางเรียน Live สำเร็จ");
            onUpdate();
        } catch (e: unknown) {
            toast.error(e instanceof Error ? e.message : "เกิดข้อผิดพลาดในการเชื่อมต่อ");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="space-y-6 bg-white p-6 rounded-xl border shadow-sm">
            {/* Header */}
            <div className="flex justify-between items-center pb-5 border-b">
                <div>
                    <h2 className="text-2xl font-black text-gray-900 flex items-center gap-3">
                        <CalendarDays className="text-primary" size={28} /> ตารางเรียน Online-Live
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">จัดการตารางเรียนสด ลิงก์ Zoom และวิดีโอย้อนหลัง</p>
                </div>
                <Button type="button" onClick={handleSave} disabled={loading} className="px-8 shadow-lg shadow-primary/20">
                    {loading ? <Loader2 className="animate-spin mr-2" size={20} /> : <Save className="mr-2" size={20} />}
                    บันทึก
                </Button>
            </div>

            {/* Session list */}
            <div className="space-y-4">
                {sessions.map((session, index) => (
                    <div key={index} className="border border-gray-200 rounded-xl overflow-hidden">
                        {/* Session header */}
                        <div className="flex items-center justify-between px-4 py-3 bg-blue-50 border-b border-blue-100">
                            <span className="font-bold text-blue-700 text-sm">ครั้งที่ {session.sessionNumber}</span>
                            <button
                                type="button"
                                onClick={() => removeSession(index)}
                                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            >
                                <Trash2 size={15} />
                            </button>
                        </div>

                        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Topic */}
                            <div className="md:col-span-2">
                                <label className="block text-xs font-semibold text-gray-600 mb-1">หัวข้อการเรียน *</label>
                                <input
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                                    value={session.topic}
                                    onChange={e => updateSession(index, "topic", e.target.value)}
                                    placeholder="เช่น Introduction to React"
                                />
                            </div>

                            {/* Date */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">วันที่</label>
                                <input
                                    type="date"
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                                    value={session.date}
                                    onChange={e => updateSession(index, "date", e.target.value)}
                                />
                            </div>

                            {/* Time */}
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">เวลาเริ่ม</label>
                                    <input
                                        type="time"
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none"
                                        value={session.startTime}
                                        onChange={e => updateSession(index, "startTime", e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">เวลาสิ้นสุด</label>
                                    <input
                                        type="time"
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none"
                                        value={session.endTime}
                                        onChange={e => updateSession(index, "endTime", e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* Zoom link */}
                            <div className="md:col-span-2">
                                <label className="flex items-center gap-2 text-xs font-semibold text-gray-600 mb-1">
                                    <Link size={12} /> ลิงก์ Zoom
                                    <span className="text-gray-400 font-normal">(นักเรียนเห็นหลังชำระเงิน)</span>
                                </label>
                                <input
                                    type="text"
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                                    value={session.zoomLink}
                                    onChange={e => updateSession(index, "zoomLink", e.target.value)}
                                    placeholder="https://zoom.us/j/..."
                                />
                            </div>

                            {/* ─── เอกสารประกอบการเรียน (PDF) ─────── */}
                            <div className="md:col-span-2 border border-gray-200 rounded-xl p-4 space-y-3 bg-white">
                                <label className="text-xs font-semibold text-gray-600 flex items-center gap-1.5">
                                    📄 เอกสารประกอบการเรียน
                                </label>
                                {session.materialUrl && !pdfUploading[index] ? (
                                    <div className="flex items-center gap-2 px-3 py-2 bg-orange-50 border border-orange-200 rounded-lg text-sm">
                                        <File size={15} className="text-orange-500 shrink-0" />
                                        <span className="text-orange-700 flex-1 truncate font-medium">
                                            {pdfFileName[index] || "ไฟล์ PDF"}
                                        </span>
                                        <a href={session.materialUrl} target="_blank" rel="noreferrer"
                                            className="text-xs text-blue-500 hover:underline shrink-0">ดู</a>
                                        <button
                                            type="button"
                                            onClick={() => { updateSession(index, "materialUrl", ""); updateSession(index, "content", ""); setPdfFileName(prev => ({ ...prev, [index]: null })); }}
                                            className="text-gray-400 hover:text-red-500"
                                        ><X size={14} /></button>
                                    </div>
                                ) : pdfUploading[index] ? (
                                    <div className="space-y-1.5">
                                        <div className="flex justify-between text-xs text-gray-500">
                                            <span className="truncate max-w-[200px]">{pdfFileName[index]}</span>
                                            <span className="font-semibold">{pdfProgress[index] || 0}%</span>
                                        </div>
                                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-orange-400 to-orange-300 rounded-full transition-all duration-300"
                                                style={{ width: `${pdfProgress[index] || 0}%` }}
                                            />
                                        </div>
                                        <p className="text-xs text-gray-400">กำลังอัปโหลด PDF...</p>
                                    </div>
                                ) : (
                                    <div className="flex gap-2">
                                        <input
                                            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                                            value={session.content}
                                            onChange={e => { updateSession(index, "content", e.target.value); updateSession(index, "materialUrl", e.target.value); }}
                                            placeholder="https://... หรืออัปโหลดไฟล์ →"
                                        />
                                        <div className="relative shrink-0">
                                            <input
                                                id={`live-pdf-${index}`}
                                                type="file"
                                                accept="application/pdf"
                                                onChange={e => handlePdfUpload(index, e)}
                                                className="hidden"
                                                disabled={!!pdfUploading[index]}
                                            />
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    document.getElementById(`live-pdf-${index}`)?.click();
                                                }}
                                                disabled={!!pdfUploading[index]}
                                                className="flex items-center gap-1.5 px-3 py-2 bg-orange-50 text-orange-600 text-sm font-medium rounded-lg hover:bg-orange-100 cursor-pointer transition-colors whitespace-nowrap border border-orange-200"
                                            >
                                                <Upload size={14} /> อัปโหลด PDF
                                            </button>
                                        </div>
                                    </div>
                                )}
                                <p className="text-[11px] text-gray-400 mt-0.5">รองรับ .pdf ขนาดไม่เกิน 50MB</p>
                            </div>

                            {/* ─── วิดีโอย้อนหลัง (with toggle) ─────── */}
                            <div className="md:col-span-2 border border-gray-200 rounded-xl p-4 space-y-3 bg-white">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-semibold text-gray-600 flex items-center gap-1.5">
                                        🎬 วิดีโอย้อนหลัง
                                    </label>
                                    {/* Segmented Control: YouTube / Gumlet */}
                                    <div className="flex bg-gray-100 rounded-lg p-0.5">
                                        <button
                                            type="button"
                                            onClick={() => setVideoSourceToggle(prev => ({ ...prev, [index]: "YOUTUBE" }))}
                                            className={`px-3 py-1 text-xs font-semibold rounded-md transition-all duration-200 ${
                                                (videoSourceToggle[index] || "YOUTUBE") === "YOUTUBE"
                                                    ? "bg-white text-primary shadow-sm"
                                                    : "text-gray-500 hover:text-gray-700"
                                            }`}
                                        >
                                            YouTube
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setVideoSourceToggle(prev => ({ ...prev, [index]: "GUMLET" }))}
                                            className={`px-3 py-1 text-xs font-semibold rounded-md transition-all duration-200 ${
                                                (videoSourceToggle[index] || "YOUTUBE") === "GUMLET"
                                                    ? "bg-white text-primary shadow-sm"
                                                    : "text-gray-500 hover:text-gray-700"
                                            }`}
                                        >
                                            Gumlet
                                        </button>
                                    </div>
                                </div>

                                {/* YouTube input */}
                                {(videoSourceToggle[index] || "YOUTUBE") === "YOUTUBE" && (
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-600 mb-1">YouTube URL</label>
                                        <input
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                                            value={session.videoUrl}
                                            onChange={e => updateSession(index, "videoUrl", e.target.value)}
                                            placeholder="https://youtube.com/watch?v=..."
                                        />
                                    </div>
                                )}

                                {/* Gumlet input */}
                                {(videoSourceToggle[index] || "YOUTUBE") === "GUMLET" && (
                                    <div>
                                        {session.gumletVideoId ? (
                                            <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg text-sm">
                                                <CheckCircle2 size={16} className="text-green-600 shrink-0" />
                                                <span className="text-green-700 flex-1 truncate font-medium">
                                                    ID: {session.gumletVideoId}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => updateSession(index, "gumletVideoId", "")}
                                                    className="text-gray-400 hover:text-red-500"
                                                ><X size={14} /></button>
                                            </div>
                                        ) : uploading[index] ? (
                                            <div className="space-y-1.5 p-3 border border-gray-200 rounded-lg">
                                                <div className="flex justify-between text-xs text-gray-500">
                                                    <span className="truncate max-w-[200px]">{fileName[index] || "Uploading..."}</span>
                                                    <span className="font-semibold">{progress[index] || 0}%</span>
                                                </div>
                                                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                                    <div className="h-full bg-gradient-to-r from-blue-400 to-blue-300 rounded-full transition-all duration-300" style={{ width: `${progress[index] || 0}%` }} />
                                                </div>
                                                <p className="text-xs text-gray-400">กำลังอัปโหลดและประมวลผลวิดีโอ (Gumlet)...</p>
                                            </div>
                                        ) : (
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-600 mb-1">Gumlet Video ID</label>
                                                <div className="flex gap-2">
                                                    <input
                                                        className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                                                        value={session.gumletVideoId}
                                                        onChange={e => updateSession(index, "gumletVideoId", e.target.value)}
                                                        placeholder="กรอก Gumlet Video ID..."
                                                    />
                                                    <div className="relative shrink-0">
                                                        <input
                                                            id={`live-video-${index}`}
                                                            type="file"
                                                            accept="video/*"
                                                            onChange={e => handleVideoUpload(index, e)}
                                                            className="hidden"
                                                            disabled={!!uploading[index]}
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                e.stopPropagation();
                                                                document.getElementById(`live-video-${index}`)?.click();
                                                            }}
                                                            disabled={!!uploading[index]}
                                                            className="flex items-center gap-1.5 px-3 py-2 bg-blue-50 text-blue-600 text-sm font-medium rounded-lg hover:bg-blue-100 cursor-pointer transition-colors whitespace-nowrap border border-blue-200"
                                                        >
                                                            <Upload size={14} /> อัปโหลด MP4
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Add session */}
            <button
                type="button"
                onClick={addSession}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-primary border-2 border-dashed border-primary/30 hover:border-primary/60 hover:bg-primary/5 rounded-xl transition-colors"
            >
                <Plus size={16} /> เพิ่มครั้งเรียน
            </button>
        </div>
    );
}
