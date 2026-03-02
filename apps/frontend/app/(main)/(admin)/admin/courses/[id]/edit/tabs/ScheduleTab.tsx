"use client";

import { useState, useEffect } from "react";
import { Save, Loader2, Layers } from "lucide-react";
import { ScheduleInput, type ScheduleSession } from "@/app/components/ui/ScheduleInput";
import type { Course } from "@/app/lib/types";
import { useToast } from "@/app/components/ui/Toast";
import { Button } from "@/app/components/ui/Button";

interface ScheduleTabProps {
    course: Course;
    onUpdate: () => void;
}

export function ScheduleTab({ course, onUpdate }: ScheduleTabProps) {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [sessions, setSessions] = useState<ScheduleSession[]>([]);

    useEffect(() => {
        if (course.schedules) {
            const mapped = course.schedules.map(s => ({
                id: s.id,
                title: s.topic,
                chapterTitle: (s as any).chapterTitle || "",
                videoUrl: (s as any).videoUrl || "",
                materialUrl: (s as any).materialUrl || "",
                sessionNumber: (s as any).sessionNumber,
            }));
            setSessions(mapped);
        }
    }, [course]);

    const handleSyncSave = async () => {
        setLoading(true);
        try {
            const res = await fetch(`http://localhost:4000/api/schedules/sync/${course.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessions }),
            });
            const data = await res.json();
            if (data.success) {
                toast.success("บันทึกเนื้อหาบทเรียนสำเร็จ ✨");
                onUpdate();
            } else {
                toast.error(data.error || "บันทึกไม่สำเร็จ");
            }
        } catch (error) {
            toast.error("เกิดข้อผิดพลาดในการเชื่อมต่อ");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 bg-white p-6 rounded-xl border shadow-sm">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-5 border-b border-gray-50">
                <div>
                    <h2 className="text-2xl font-black text-gray-900 flex items-center gap-3">
                        <Layers className="text-primary" size={28} /> จัดการเนื้อหาบทเรียน
                    </h2>
                    <p className="text-sm text-gray-500 mt-1 italic">วิชา: {course.title}</p>
                </div>
                <Button onClick={handleSyncSave} disabled={loading} className="w-full md:w-auto h-12 px-8 shadow-lg shadow-primary/20">
                    {loading ? <Loader2 className="animate-spin mr-2" size={20} /> : <Save className="mr-2" size={20} />}
                    บันทึกเนื้อหาทั้งหมด
                </Button>
            </div>
            <ScheduleInput value={sessions} onChange={setSessions} />
        </div>
    );
}