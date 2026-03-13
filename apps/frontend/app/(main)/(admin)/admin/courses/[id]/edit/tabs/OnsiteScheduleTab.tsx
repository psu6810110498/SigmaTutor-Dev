"use client";

import { useState, useEffect } from "react";
import { Save, Loader2, MapPin, Plus, Trash2, Video, AlertCircle } from "lucide-react";
import type { Course } from "@/app/lib/types";
import { useToast } from "@/app/components/ui/Toast";
import { Button } from "@/app/components/ui/Button";

interface OnsiteScheduleTabProps {
    course: Course;
    onUpdate: () => void;
}

type ScheduleStatus = "ON_SCHEDULE" | "POSTPONED" | "CANCELLED";

interface OnsiteSession {
    id?: string;
    sessionNumber: number;
    topic: string;
    date: string;
    startTime: string;
    endTime: string;
    location: string;
    status: ScheduleStatus;
    // Replay video
    gumletVideoId: string;
    videoUrl: string;
}

const API = "http://localhost:4000/api";
const CREDS: RequestInit = { credentials: "include" };

const STATUS_LABELS: Record<ScheduleStatus, string> = {
    ON_SCHEDULE: "ตามกำหนด",
    POSTPONED: "เลื่อน",
    CANCELLED: "ยกเลิก",
};

const STATUS_COLORS: Record<ScheduleStatus, string> = {
    ON_SCHEDULE: "text-green-700 bg-green-50 border-green-200",
    POSTPONED: "text-orange-700 bg-orange-50 border-orange-200",
    CANCELLED: "text-red-700 bg-red-50 border-red-200",
};

function toDateInput(iso: string | null | undefined): string {
    if (!iso) return "";
    try { return new Date(iso).toISOString().split("T")[0]; } catch { return ""; }
}

function toTimeInput(iso: string | null | undefined): string {
    if (!iso) return "";
    try { return new Date(iso).toTimeString().slice(0, 5); } catch { return ""; }
}

function combineDatetime(date: string, time: string): string | null {
    if (!date || !time) return null;
    return new Date(`${date}T${time}:00`).toISOString();
}

function emptySession(sessionNumber: number): OnsiteSession {
    return {
        sessionNumber,
        topic: "",
        date: "",
        startTime: "",
        endTime: "",
        location: "",
        status: "ON_SCHEDULE",
        gumletVideoId: "",
        videoUrl: "",
    };
}

export function OnsiteScheduleTab({ course, onUpdate }: OnsiteScheduleTabProps) {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [sessions, setSessions] = useState<OnsiteSession[]>([]);
    const defaultLocation = course.location || "";

    useEffect(() => {
        if (course.schedules && course.schedules.length > 0) {
            setSessions(course.schedules.map((s, i) => ({
                id: s.id,
                sessionNumber: s.sessionNumber ?? (i + 1),
                topic: s.topic || "",
                date: toDateInput(s.date),
                startTime: toTimeInput(s.startTime),
                endTime: toTimeInput(s.endTime),
                location: s.location || "",
                status: (s.status as ScheduleStatus) || "ON_SCHEDULE",
                gumletVideoId: s.gumletVideoId || "",
                videoUrl: s.videoUrl || "",
            })));
        } else {
            setSessions([emptySession(1)]);
        }
    }, [course]);

    function updateSession<K extends keyof OnsiteSession>(index: number, key: K, value: OnsiteSession[K]) {
        setSessions(prev => prev.map((s, i) => i === index ? { ...s, [key]: value } : s));
    }

    function addSession() {
        const next = sessions.length + 1;
        setSessions(prev => [...prev, { ...emptySession(next), location: defaultLocation }]);
    }

    function removeSession(index: number) {
        if (sessions.length === 1) { toast.error("ต้องมีอย่างน้อย 1 ครั้ง"); return; }
        setSessions(prev => prev.filter((_, i) => i !== index).map((s, i) => ({ ...s, sessionNumber: i + 1 })));
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
                location: s.location || null,
                isOnline: false,
                status: s.status,
                gumletVideoId: s.gumletVideoId || null,
                videoUrl: s.videoUrl || null,
                videoProvider: s.gumletVideoId ? "GUMLET" : "YOUTUBE",
            }));

            const res = await fetch(`${API}/schedules/sync/${course.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                ...CREDS,
                body: JSON.stringify({ sessions: payload }),
            });
            const data = await res.json();
            if (!res.ok || !data.success) throw new Error(data.error || "บันทึกไม่สำเร็จ");
            toast.success("บันทึกตารางเรียน Onsite สำเร็จ");
            onUpdate();
        } catch (e: unknown) {
            toast.error(e instanceof Error ? e.message : "เกิดข้อผิดพลาดในการเชื่อมต่อ");
        } finally {
            setLoading(false);
        }
    }

    const hasPostponed = sessions.some(s => s.status === "POSTPONED");

    return (
        <div className="space-y-6 bg-white p-6 rounded-xl border shadow-sm">
            {/* Header */}
            <div className="flex justify-between items-center pb-5 border-b">
                <div>
                    <h2 className="text-2xl font-black text-gray-900 flex items-center gap-3">
                        <MapPin className="text-primary" size={28} /> ตารางเรียน Onsite
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">จัดการตารางเรียนสถานที่จริง สถานะ และวิดีโอย้อนหลัง</p>
                </div>
                <Button onClick={handleSave} disabled={loading} className="px-8 shadow-lg shadow-primary/20">
                    {loading ? <Loader2 className="animate-spin mr-2" size={20} /> : <Save className="mr-2" size={20} />}
                    บันทึก
                </Button>
            </div>

            {/* Notice for postponed sessions */}
            {hasPostponed && (
                <div className="flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-lg px-4 py-3 text-sm text-orange-700">
                    <AlertCircle size={16} /> มีบางครั้งที่ถูกเลื่อน — จะแจ้งนักเรียนผ่านหน้ารายละเอียดคอร์ส
                </div>
            )}

            {/* Session list */}
            <div className="space-y-4">
                {sessions.map((session, index) => (
                    <div key={index} className="border border-gray-200 rounded-xl overflow-hidden">
                        {/* Session header */}
                        <div className={`flex items-center justify-between px-4 py-3 border-b ${STATUS_COLORS[session.status]}`}>
                            <div className="flex items-center gap-3">
                                <span className="font-bold text-sm">ครั้งที่ {session.sessionNumber}</span>
                                <select
                                    className={`text-xs font-semibold border rounded-lg px-2 py-1 focus:outline-none ${STATUS_COLORS[session.status]}`}
                                    value={session.status}
                                    onChange={e => updateSession(index, "status", e.target.value as ScheduleStatus)}
                                >
                                    {(Object.keys(STATUS_LABELS) as ScheduleStatus[]).map(s => (
                                        <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                                    ))}
                                </select>
                            </div>
                            <button
                                type="button"
                                onClick={() => removeSession(index)}
                                className="p-1.5 text-current opacity-50 hover:opacity-100 hover:bg-red-100 hover:text-red-600 rounded-lg transition-colors"
                            >
                                <Trash2 size={15} />
                            </button>
                        </div>

                        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Topic */}
                            <div className="md:col-span-2">
                                <label className="block text-xs font-semibold text-gray-600 mb-1">หัวข้อ</label>
                                <input
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                                    value={session.topic}
                                    onChange={e => updateSession(index, "topic", e.target.value)}
                                    placeholder={`ครั้งที่ ${session.sessionNumber}`}
                                />
                            </div>

                            {/* Date */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">วันที่</label>
                                <input
                                    type="date"
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none"
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

                            {/* Location */}
                            <div className="md:col-span-2">
                                <label className="flex items-center gap-1 text-xs font-semibold text-gray-600 mb-1">
                                    <MapPin size={11} /> สถานที่
                                </label>
                                <input
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                                    value={session.location}
                                    onChange={e => updateSession(index, "location", e.target.value)}
                                    placeholder="เช่น ห้อง 201 อาคาร A"
                                />
                            </div>

                            {/* Replay video */}
                            <div className="md:col-span-2 pt-2 border-t border-gray-100">
                                <label className="flex items-center gap-2 text-xs font-semibold text-gray-600 mb-2">
                                    <Video size={12} className="text-purple-500" /> วิดีโอย้อนหลัง (ไม่แสดงในหน้าคอร์ส)
                                </label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs text-gray-500 mb-1">Gumlet Video ID</label>
                                        <input
                                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-200 bg-purple-50/30"
                                            value={session.gumletVideoId}
                                            onChange={e => updateSession(index, "gumletVideoId", e.target.value)}
                                            placeholder="Gumlet Video ID"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-500 mb-1">หรือ Video URL</label>
                                        <input
                                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-200 bg-purple-50/30"
                                            value={session.videoUrl}
                                            onChange={e => updateSession(index, "videoUrl", e.target.value)}
                                            placeholder="https://..."
                                        />
                                    </div>
                                </div>
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
