"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, Calendar, MapPin, Video, Clock } from "lucide-react";
import { scheduleApi } from "@/app/lib/api";
import type { Course, CourseSchedule } from "@/app/lib/types";
import { useToast } from "@/app/components/ui/Toast";
import { ConfirmDialog } from "@/app/components/ui/ConfirmDialog";
import { Input } from "@/app/components/ui/Input";
import { Button } from "@/app/components/ui/Button";

interface ScheduleTabProps {
    course: Course;
    onUpdate: () => void;
}

export function ScheduleTab({ course, onUpdate }: ScheduleTabProps) {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);

    // UI State
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [confirmDelete, setConfirmDelete] = useState<{ id: string; topic: string } | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        date: "",
        startTime: "",
        endTime: "",
        topic: "",
        location: "", // Can be Zoom link if isOnline
        isOnline: false
    });

    const resetForm = () => {
        setFormData({
            date: "",
            startTime: "",
            endTime: "",
            topic: "",
            location: "",
            isOnline: course.courseType === "ONLINE_LIVE" // Default based on course type
        });
        setIsAdding(false);
        setEditingId(null);
    };

    const handleSave = async () => {
        if (!formData.topic || !formData.date || !formData.startTime || !formData.endTime) {
            toast.error("กรุณากรอกข้อมูลให้ครบถ้วน");
            return;
        }

        setLoading(true);
        try {
            // Combine date + time to ISO string
            const dateStr = formData.date; // YYYY-MM-DD
            const startISO = new Date(`${dateStr}T${formData.startTime}:00`).toISOString();
            const endISO = new Date(`${dateStr}T${formData.endTime}:00`).toISOString();
            const dateISO = new Date(dateStr).toISOString();

            const payload = {
                courseId: course.id,
                topic: formData.topic,
                location: formData.location,
                isOnline: formData.isOnline,
                date: dateISO,
                startTime: startISO,
                endTime: endISO
            };

            if (editingId) {
                const res = await scheduleApi.update(editingId, payload);
                if (res.success) {
                    toast.success("บันทึกข้อมูลเรียบร้อย");
                    resetForm();
                    onUpdate();
                } else {
                    toast.error(res.error || "Failed to update");
                }
            } else {
                const res = await scheduleApi.create(payload);
                if (res.success) {
                    toast.success("เพิ่มตารางเรียนเรียบร้อย");
                    resetForm();
                    onUpdate();
                } else {
                    toast.error(res.error || "Failed to create");
                }
            }
        } catch (error) {
            console.error(error);
            toast.error("An error occurred");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!confirmDelete) return;
        setLoading(true);
        try {
            await scheduleApi.delete(confirmDelete.id);
            toast.success("ลบข้อมูลเรียบร้อย");
            setConfirmDelete(null);
            onUpdate();
        } catch (error) {
            toast.error("Delete failed");
        } finally {
            setLoading(false);
        }
    };

    const startEdit = (schedule: CourseSchedule) => {
        const dateObj = new Date(schedule.date);
        const startObj = new Date(schedule.startTime);
        const endObj = new Date(schedule.endTime);

        setEditingId(schedule.id);
        setFormData({
            topic: schedule.topic,
            location: schedule.location || "",
            isOnline: schedule.isOnline,
            date: dateObj.toISOString().split('T')[0],
            startTime: startObj.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
            endTime: endObj.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
        });
        setIsAdding(true); // Re-use the add form UI
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900">ตารางเรียน</h2>
                {!isAdding && (
                    <Button onClick={() => { resetForm(); setIsAdding(true); }}>
                        <Plus size={16} className="mr-2" /> เพิ่มตารางเรียน
                    </Button>
                )}
            </div>

            {/* Form */}
            {isAdding && (
                <div className="bg-gray-50 border rounded-lg p-6 animate-fade-in-up">
                    <h4 className="font-medium mb-4 text-gray-900">{editingId ? "แก้ไขตารางเรียน" : "เพิ่มตารางเรียนใหม่"}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">หัวข้อการเรียน</label>
                            <Input
                                value={formData.topic}
                                onChange={e => setFormData({ ...formData, topic: e.target.value })}
                                placeholder="เช่น บทนำ, ตะลุยโจทย์"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">วันที่เรียน</label>
                            <Input
                                type="date"
                                value={formData.date}
                                onChange={e => setFormData({ ...formData, date: e.target.value })}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">เวลาเริ่ม</label>
                                <Input
                                    type="time"
                                    value={formData.startTime}
                                    onChange={e => setFormData({ ...formData, startTime: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">เวลาจบ</label>
                                <Input
                                    type="time"
                                    value={formData.endTime}
                                    onChange={e => setFormData({ ...formData, endTime: e.target.value })}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                {formData.isOnline ? "Link Zoom / Meeting" : "สถานที่ / ห้องเรียน"}
                            </label>
                            <Input
                                value={formData.location}
                                onChange={e => setFormData({ ...formData, location: e.target.value })}
                                placeholder={formData.isOnline ? "https://zoom.us/..." : "Room 101"}
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-2 mb-4">
                        <input
                            type="checkbox"
                            id="isOnline"
                            checked={formData.isOnline}
                            onChange={e => setFormData({ ...formData, isOnline: e.target.checked })}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <label htmlFor="isOnline" className="text-sm text-gray-700">เรียนออนไลน์ (Live)</label>
                    </div>

                    <div className="flex gap-2 justify-end">
                        <Button variant="outline" onClick={resetForm}>ยกเลิก</Button>
                        <Button onClick={handleSave} disabled={loading}>บันทึก</Button>
                    </div>
                </div>
            )}

            {/* List */}
            <div className="space-y-4">
                {course.schedules?.map((schedule) => (
                    <div key={schedule.id} className="border rounded-lg bg-white p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-start gap-4">
                            <div className="bg-blue-50 p-3 rounded-lg text-blue-600 text-center min-w-[60px]">
                                <div className="text-xs font-bold uppercase">{new Date(schedule.date).toLocaleDateString("en-US", { month: "short" })}</div>
                                <div className="text-xl font-bold">{new Date(schedule.date).getDate()}</div>
                            </div>
                            <div>
                                <h3 className="font-medium text-gray-900">{schedule.topic}</h3>
                                <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                                    <span className="flex items-center gap-1">
                                        <Clock size={14} />
                                        {new Date(schedule.startTime).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })} -
                                        {new Date(schedule.endTime).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        {schedule.isOnline ? <Video size={14} /> : <MapPin size={14} />}
                                        {schedule.location || (schedule.isOnline ? "Online Live" : "Onsite")}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 md:self-center self-end">
                            <Button size="sm" variant="ghost" onClick={() => startEdit(schedule)}>
                                <Pencil size={16} />
                            </Button>
                            <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => setConfirmDelete({ id: schedule.id, topic: schedule.topic })}>
                                <Trash2 size={16} />
                            </Button>
                        </div>
                    </div>
                ))}

                {(!course.schedules || course.schedules.length === 0) && !isAdding && (
                    <div className="text-center py-12 bg-white rounded-lg border border-dashed text-gray-400">
                        <Calendar className="mx-auto h-12 w-12 mb-2 opacity-50" />
                        <p>ยังไม่มีตารางเรียน</p>
                    </div>
                )}
            </div>

            <ConfirmDialog
                open={!!confirmDelete}
                title="ลบตารางเรียน"
                message={`คุณยืนยันที่จะลบตารางเรียน "${confirmDelete?.topic}" ใช่หรือไม่?`}
                onConfirm={handleDelete}
                onCancel={() => setConfirmDelete(null)}
                loading={loading}
            />
        </div>
    );
}
