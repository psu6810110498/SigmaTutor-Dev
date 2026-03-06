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

    // ดึงข้อมูลเดิมมาแสดง
    useEffect(() => {
        if (course.schedules && course.schedules.length > 0) {
            const mapped = course.schedules.map(s => ({
                id: s.id,
                title: s.topic || "",
                chapterTitle: (s as any).chapterTitle || "",
                videoUrl: (s as any).videoUrl || "",
                materialUrl: (s as any).materialUrl || "",
                sessionNumber: (s as any).sessionNumber,
                videoProvider: (s as any).videoProvider || 'YOUTUBE',
                gumletVideoId: (s as any).gumletVideoId || '',
            }));
            setSessions(mapped);
        }
    }, [course]);

    // ฟังก์ชันบันทึก
    const handleSyncSave = async () => {
        setLoading(true);
        try {
            // ✅ 1. ดึง Token แบบครอบจักรวาล (หาทั้งจาก LocalStorage และ Cookies ทุกชื่อที่เป็นไปได้)
            const getUniversalToken = () => {
                let t = localStorage.getItem('token') || localStorage.getItem('accessToken') || localStorage.getItem('adminToken');
                if (!t) {
                    const match = document.cookie.match(/(?:^|;)\s*(token|accessToken)\s*=\s*([^;]+)/);
                    if (match) t = match[2];
                }
                return t;
            };

            const token = getUniversalToken();

            // ✅ 2. เตรียม Headers ให้ครบถ้วน
            const headers: Record<string, string> = {
                'Content-Type': 'application/json'
            };

            if (token) {
                headers['Authorization'] = `Bearer ${token}`; // แทรก Token ตรงนี้ถ้าหาเจอ
            }

            // ✅ 3. ส่งข้อมูลไปพร้อมกับ Token และ Credentials
            const res = await fetch(`http://localhost:4000/api/schedules/sync/${course.id}`, {
                method: 'PUT',
                headers: headers,
                credentials: 'include',
                body: JSON.stringify({ sessions }),
            });

            // บางครั้ง Backend อาจส่ง Error กลับมาเป็น Text ไม่ใช่ JSON
            let data;
            try {
                data = await res.json();
            } catch (e) {
                throw new Error("Invalid response from server");
            }

            if (res.ok && data.success) {
                toast.success("บันทึกเนื้อหาบทเรียนสำเร็จ ✨");
                onUpdate();
            } else {
                toast.error(data.error || data.message || "บันทึกไม่สำเร็จ (Unauthorized / No Token)");
            }
        } catch (error) {
            console.error(error);
            toast.error("เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 bg-white p-6 rounded-xl border shadow-sm">
            <div className="flex justify-between items-center gap-4 pb-5 border-b">
                <div>
                    <h2 className="text-2xl font-black text-gray-900 flex items-center gap-3">
                        <Layers className="text-primary" size={28} /> จัดการเนื้อหาบทเรียน
                    </h2>
                </div>
                <Button onClick={handleSyncSave} disabled={loading} className="px-8 shadow-lg shadow-primary/20">
                    {loading ? <Loader2 className="animate-spin mr-2" size={20} /> : <Save className="mr-2" size={20} />}
                    บันทึกเนื้อหาทั้งหมด
                </Button>
            </div>

            <ScheduleInput value={sessions} onChange={setSessions} />
        </div>
    );
}