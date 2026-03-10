'use client';

import { useState } from 'react';
import { Plus, Trash2, Calendar, Video, FileText, Bookmark, Hash } from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────

export type CourseType = 'ONLINE' | 'ONLINE_LIVE' | 'ONSITE';

export interface ScheduleSession {
    id: string;          // local uuid for key
    title: string;       // หัวข้อเนื้อหาย่อย
    chapterTitle?: string; // ชื่อบทเรียน (เช่น บทที่ 1)
    videoUrl?: string;     // ลิงก์วิดีโอเนื้อหา
    materialUrl?: string;  // ลิงก์ไฟล์ประกอบ
    sessionNumber?: number; // ลำดับครั้งที่
    videoProvider?: 'YOUTUBE' | 'GUMLET'; // ตัวเลือก Platform วิดีโอ
    gumletVideoId?: string; // Video ID ของ Gumlet
}

interface ScheduleInputProps {
    value: ScheduleSession[];
    onChange: (sessions: ScheduleSession[]) => void;
}

// ── Helpers ────────────────────────────────────────────────────

let _id = 0;
const newId = () => `s${Date.now()}${++_id}`;

const emptySession = (nextNumber: number): ScheduleSession => ({
    id: newId(),
    title: '',
    chapterTitle: '',
    videoUrl: '',
    materialUrl: '',
    sessionNumber: nextNumber,
    videoProvider: 'YOUTUBE',
    gumletVideoId: '',
});

const inputBase =
    'w-full h-9 px-3 text-sm rounded-md border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all';

// ── Main Component ─────────────────────────────────────────────

export function ScheduleInput({ value, onChange }: ScheduleInputProps) {
    const sessions = value;

    // ✅ เพิ่ม State สำหรับเช็กว่าบทเรียนไหนกำลังอัปโหลด PDF อยู่
    const [uploadingId, setUploadingId] = useState<string | null>(null);
    // ✅ เพิ่ม State สำหรับเช็กว่าบทเรียนไหนกำลังอัปโหลดวิดีโอ Gumlet อยู่
    const [uploadingGumletId, setUploadingGumletId] = useState<string | null>(null);
    const [gumletProgress, setGumletProgress] = useState<Record<string, number>>({});

    const addSession = () => onChange([...sessions, emptySession(sessions.length + 1)]);

    const removeSession = (id: string) =>
        onChange(sessions.filter((s) => s.id !== id));

    const updateSession = (id: string, field: keyof ScheduleSession, val: any) =>
        onChange(sessions.map((s) => (s.id === id ? { ...s, [field]: val } : s)));

    // ✅ ฟังก์ชันจัดการอัปโหลด PDF
    const handlePdfUpload = async (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.type !== "application/pdf") {
            alert("กรุณาเลือกไฟล์ PDF เท่านั้น");
            return;
        }

        setUploadingId(id);
        const formData = new FormData();
        formData.append("file", file);

        try {
            // ✅ ดึง Token แบบเดียวกับ ScheduleTab (หาจาก localStorage และ Cookies)
            let token = localStorage.getItem('token') || localStorage.getItem('accessToken') || localStorage.getItem('adminToken');
            if (!token) {
                const match = document.cookie.match(/(?:^|;)\s*(token|accessToken)\s*=\s*([^;]+)/);
                if (match) token = match[2];
            }

            const headers: Record<string, string> = {};
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const res = await fetch('http://localhost:4000/api/courses/upload/pdf', {
                method: 'POST',
                credentials: 'include',
                headers,
                body: formData
            });
            const data = await res.json();

            if (data.url) {
                // อัปเดตลิงก์ PDF เข้าไปในบทเรียนนั้นๆ อัตโนมัติ
                updateSession(id, 'materialUrl', data.url);
            } else {
                alert("อัปโหลดไม่สำเร็จ: " + (data.error || "Unknown error"));
            }
        } catch (error) {
            console.error(error);
            alert("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์ตอนอัปโหลดไฟล์");
        } finally {
            setUploadingId(null);
            e.target.value = ''; // รีเซ็ตค่า input เผื่อผู้ใช้เลือกไฟล์เดิมซ้ำ
        }
    };

    // ✅ ฟังก์ชันจัดการอัปโหลดวิดีโอ Gumlet
    const handleGumletVideoUpload = async (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('video/')) {
            alert("กรุณาเลือกไฟล์วิดีโอเท่านั้น");
            return;
        }

        try {
            setUploadingGumletId(id);
            setGumletProgress(prev => ({ ...prev, [id]: 0 }));

            let token = localStorage.getItem('token') || localStorage.getItem('accessToken') || localStorage.getItem('adminToken');
            if (!token) {
                const match = document.cookie.match(/(?:^|;)\s*(token|accessToken)\s*=\s*([^;]+)/);
                if (match) token = match[2];
            }
            const headers: Record<string, string> = {};
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const res = await fetch('http://localhost:4000/api/gumlet/upload-url', {
                method: 'POST',
                credentials: 'include',
                headers
            });
            const data = await res.json();

            if (!data.success || !data.upload_url) {
                alert(data.error || "ไม่สามารถสร้างลิงก์อัปโหลดได้");
                setUploadingGumletId(null);
                return;
            }

            const { upload_url, asset_id } = data;

            return new Promise<void>((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                xhr.open('PUT', upload_url, true);
                xhr.setRequestHeader('Content-Type', file.type);

                xhr.upload.onprogress = (event) => {
                    if (event.lengthComputable) {
                        const percentComplete = Math.round((event.loaded / event.total) * 100);
                        setGumletProgress(prev => ({ ...prev, [id]: percentComplete }));
                    }
                };

                xhr.onload = () => {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        updateSession(id, 'gumletVideoId', asset_id);
                        setUploadingGumletId(null);
                        resolve();
                    } else {
                        console.error('Upload failed with status', xhr.status, xhr.responseText);
                        alert("อัปโหลดไม่สำเร็จ หรือถูกยกเลิก");
                        setUploadingGumletId(null);
                        reject(new Error("Upload failed"));
                    }
                };

                xhr.onerror = () => {
                    console.error('XHR Upload Error');
                    alert("เกิดข้อผิดพลาดในการอัปโหลดวิดีโอ");
                    setUploadingGumletId(null);
                    reject(new Error("XHR Error"));
                };

                xhr.send(file);
            });
        } catch (error) {
            console.error(error);
            alert("ระบบอัปโหลดมีปัญหา");
            setUploadingGumletId(null);
        } finally {
            e.target.value = '';
        }
    };

    return (
        <div className="space-y-4">
            {sessions.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/30">
                    <Calendar size={32} className="mx-auto mb-2 text-gray-300" />
                    <p className="text-sm text-gray-500 font-medium">ยังไม่มีเนื้อหาบทเรียน</p>
                    <p className="text-xs text-gray-400 mt-1">กดปุ่มด้านล่างเพื่อเริ่มจัดการเนื้อหาคอร์สนี้</p>
                </div>
            ) : (
                <>
                    {/* ── Desktop Table View ── */}
                    <div className="hidden md:block overflow-x-auto rounded-xl border border-gray-100 shadow-sm">
                        <table className="w-full text-sm border-collapse bg-white">
                            <thead>
                                <tr className="bg-gray-50/80 border-b border-gray-100 text-gray-600">
                                    <th className="px-4 py-3 text-left font-bold w-16">#</th>
                                    <th className="px-4 py-3 text-left font-bold">บทเรียนและหัวข้อ</th>
                                    <th className="px-4 py-3 text-left font-bold w-96">วิดีโอและไฟล์ประกอบ</th>
                                    <th className="px-4 py-3 w-12" />
                                </tr>
                            </thead>
                            <tbody>
                                {sessions.map((s, idx) => (
                                    <tr key={s.id} className="border-b last:border-0 hover:bg-gray-50/30 transition-colors">
                                        <td className="px-4 py-5 align-top">
                                            <input
                                                type="number"
                                                value={s.sessionNumber || idx + 1}
                                                onChange={(e) => updateSession(s.id, 'sessionNumber', Number(e.target.value))}
                                                className={inputBase}
                                            />
                                        </td>
                                        <td className="px-4 py-5 align-top space-y-2">
                                            <div className="relative">
                                                <Bookmark size={14} className="absolute left-3 top-3 text-primary/60" />
                                                <input
                                                    type="text"
                                                    value={s.chapterTitle || ''}
                                                    onChange={(e) => updateSession(s.id, 'chapterTitle', e.target.value)}
                                                    placeholder="ชื่อบทเรียน (เช่น บทที่ 1: พื้นฐาน...)"
                                                    className={`${inputBase} pl-9 font-semibold`}
                                                />
                                            </div>
                                            <input
                                                type="text"
                                                value={s.title}
                                                onChange={(e) => updateSession(s.id, 'title', e.target.value)}
                                                placeholder="ระบุหัวข้อเนื้อหาย่อยในตอนนี้..."
                                                className={inputBase}
                                            />
                                        </td>
                                        <td className="px-4 py-5 align-top space-y-2">
                                            {/* Video Provider Selector */}
                                            <div className="flex items-center gap-2 mb-1">
                                                <select
                                                    value={s.videoProvider || 'YOUTUBE'}
                                                    onChange={(e) => updateSession(s.id, 'videoProvider', e.target.value as 'YOUTUBE' | 'GUMLET')}
                                                    className={`${inputBase} w-36`}
                                                >
                                                    <option value="YOUTUBE">▶ YouTube</option>
                                                    <option value="GUMLET">🎬 Gumlet</option>
                                                </select>
                                            </div>
                                            {/* Conditional Video Input */}
                                            {(s.videoProvider || 'YOUTUBE') === 'GUMLET' ? (
                                                <div className="flex gap-2">
                                                    <div className="relative flex-1">
                                                        <Video size={14} className="absolute left-3 top-3 text-purple-500/60" />
                                                        <input
                                                            type="text"
                                                            value={s.gumletVideoId || ''}
                                                            onChange={(e) => updateSession(s.id, 'gumletVideoId', e.target.value)}
                                                            placeholder="Gumlet Video ID"
                                                            className={`${inputBase} pl-9`}
                                                        />
                                                    </div>
                                                    <div className="relative">
                                                        <input
                                                            type="file"
                                                            accept="video/mp4,video/x-m4v,video/*"
                                                            id={`desktop-video-${s.id}`}
                                                            className="hidden"
                                                            onChange={(e) => handleGumletVideoUpload(s.id, e)}
                                                            disabled={uploadingGumletId === s.id}
                                                        />
                                                        <label
                                                            htmlFor={`desktop-video-${s.id}`}
                                                            className={`h-9 px-3 bg-white border border-gray-200 rounded-md flex items-center justify-center cursor-pointer text-xs font-medium transition-colors whitespace-nowrap text-gray-600 hover:bg-gray-50 ${uploadingGumletId === s.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                        >
                                                            {uploadingGumletId === s.id ? `อัปโหลด ${gumletProgress[s.id] || 0}%` : "เลือกวิดีโอ"}
                                                        </label>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="relative">
                                                    <Video size={14} className="absolute left-3 top-3 text-red-500/60" />
                                                    <input
                                                        type="url"
                                                        value={s.videoUrl || ''}
                                                        onChange={(e) => updateSession(s.id, 'videoUrl', e.target.value)}
                                                        placeholder="ลิงก์วิดีโอ (YouTube/Vimeo)"
                                                        className={`${inputBase} pl-9`}
                                                    />
                                                </div>
                                            )}
                                            {/* ✅ เพิ่มปุ่มอัปโหลด PDF สำหรับหน้าจอ Desktop */}
                                            <div className="flex gap-2">
                                                <div className="relative flex-1">
                                                    <FileText size={14} className="absolute left-3 top-3 text-blue-500/60" />
                                                    <input
                                                        type="url"
                                                        value={s.materialUrl || ''}
                                                        onChange={(e) => updateSession(s.id, 'materialUrl', e.target.value)}
                                                        placeholder="ลิงก์ไฟล์ประกอบ (PDF/Drive)"
                                                        className={`${inputBase} pl-9`}
                                                    />
                                                </div>
                                                <div className="relative">
                                                    <input
                                                        type="file"
                                                        accept=".pdf"
                                                        id={`desktop-pdf-${s.id}`}
                                                        className="hidden"
                                                        onChange={(e) => handlePdfUpload(s.id, e)}
                                                        disabled={uploadingId === s.id}
                                                    />
                                                    <label
                                                        htmlFor={`desktop-pdf-${s.id}`}
                                                        className={`h-9 px-3 bg-white border border-gray-200 rounded-md flex items-center justify-center cursor-pointer text-xs font-medium transition-colors whitespace-nowrap text-gray-600 hover:bg-gray-50 ${uploadingId === s.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                    >
                                                        {uploadingId === s.id ? "กำลังอัปโหลด..." : "เลือกไฟล์ PDF"}
                                                    </label>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-5 align-top">
                                            <button
                                                type="button"
                                                onClick={() => removeSession(s.id)}
                                                className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* ── Mobile Cards View ── */}
                    <div className="md:hidden space-y-4">
                        {sessions.map((s, idx) => (
                            <div key={s.id} className="border border-gray-200 rounded-2xl p-5 bg-white space-y-4 shadow-sm relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-1 h-full bg-primary/20"></div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary text-xs font-bold">
                                            {idx + 1}
                                        </span>
                                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Lesson Content</span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => removeSession(s.id)}
                                        className="p-2 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>

                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 ml-1">บทเรียน (Chapter)</label>
                                        <div className="relative">
                                            <Bookmark size={14} className="absolute left-3 top-3 text-primary/40" />
                                            <input
                                                type="text"
                                                value={s.chapterTitle || ''}
                                                onChange={(e) => updateSession(s.id, 'chapterTitle', e.target.value)}
                                                placeholder="ชื่อบทเรียน..."
                                                className={`${inputBase} pl-9 font-medium`}
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 ml-1">หัวข้อเนื้อหา (Topic)</label>
                                        <input
                                            type="text"
                                            value={s.title}
                                            onChange={(e) => updateSession(s.id, 'title', e.target.value)}
                                            placeholder="ระบุเนื้อหาย่อย..."
                                            className={inputBase}
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 gap-3 pt-2 border-t border-gray-50">
                                        {/* Video Provider Selector (Mobile) */}
                                        <div>
                                            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 ml-1">แหล่งวิดีโอ (Video Provider)</label>
                                            <select
                                                value={s.videoProvider || 'YOUTUBE'}
                                                onChange={(e) => updateSession(s.id, 'videoProvider', e.target.value as 'YOUTUBE' | 'GUMLET')}
                                                className={inputBase}
                                            >
                                                <option value="YOUTUBE">▶ YouTube</option>
                                                <option value="GUMLET">🎬 Gumlet</option>
                                            </select>
                                        </div>

                                        {/* Conditional Video Input (Mobile) */}
                                        {(s.videoProvider || 'YOUTUBE') === 'GUMLET' ? (
                                            <div>
                                                <label className="block text-[10px] font-bold text-purple-500/70 uppercase mb-1 ml-1">Gumlet Video ID</label>
                                                <div className="flex gap-2">
                                                    <div className="relative flex-1">
                                                        <Video size={14} className="absolute left-3 top-3 text-purple-400" />
                                                        <input
                                                            type="text"
                                                            value={s.gumletVideoId || ''}
                                                            onChange={(e) => updateSession(s.id, 'gumletVideoId', e.target.value)}
                                                            placeholder="Gumlet Video ID..."
                                                            className={`${inputBase} pl-9`}
                                                        />
                                                    </div>
                                                    <div className="relative">
                                                        <input
                                                            type="file"
                                                            accept="video/mp4,video/x-m4v,video/*"
                                                            id={`mobile-video-${s.id}`}
                                                            className="hidden"
                                                            onChange={(e) => handleGumletVideoUpload(s.id, e)}
                                                            disabled={uploadingGumletId === s.id}
                                                        />
                                                        <label
                                                            htmlFor={`mobile-video-${s.id}`}
                                                            className={`h-9 px-3 bg-white border border-gray-200 rounded-md flex items-center justify-center cursor-pointer text-xs font-medium transition-colors whitespace-nowrap text-gray-600 hover:bg-gray-50 ${uploadingGumletId === s.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                        >
                                                            {uploadingGumletId === s.id ? `อัปโหลด ${gumletProgress[s.id] || 0}%` : "เลือกวิดีโอ"}
                                                        </label>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div>
                                                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 ml-1 text-red-500/70">วิดีโอ (Video URL)</label>
                                                <div className="relative">
                                                    <Video size={14} className="absolute left-3 top-3 text-red-400" />
                                                    <input
                                                        type="url"
                                                        value={s.videoUrl || ''}
                                                        onChange={(e) => updateSession(s.id, 'videoUrl', e.target.value)}
                                                        placeholder="YouTube Link..."
                                                        className={`${inputBase} pl-9`}
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        {/* ✅ เพิ่มปุ่มอัปโหลด PDF สำหรับหน้าจอมือถือ */}
                                        <div>
                                            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 ml-1 text-blue-500/70">เอกสาร (Material URL)</label>
                                            <div className="flex gap-2">
                                                <div className="relative flex-1">
                                                    <FileText size={14} className="absolute left-3 top-3 text-blue-400" />
                                                    <input
                                                        type="url"
                                                        value={s.materialUrl || ''}
                                                        onChange={(e) => updateSession(s.id, 'materialUrl', e.target.value)}
                                                        placeholder="PDF / Drive Link..."
                                                        className={`${inputBase} pl-9`}
                                                    />
                                                </div>
                                                <div className="relative">
                                                    <input
                                                        type="file"
                                                        accept=".pdf"
                                                        id={`mobile-pdf-${s.id}`}
                                                        className="hidden"
                                                        onChange={(e) => handlePdfUpload(s.id, e)}
                                                        disabled={uploadingId === s.id}
                                                    />
                                                    <label
                                                        htmlFor={`mobile-pdf-${s.id}`}
                                                        className={`h-9 px-3 bg-white border border-gray-200 rounded-md flex items-center justify-center cursor-pointer text-xs font-medium transition-colors whitespace-nowrap text-gray-600 hover:bg-gray-50 ${uploadingId === s.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                    >
                                                        {uploadingId === s.id ? "อัปโหลด..." : "เลือก PDF"}
                                                    </label>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}

            {/* ── Add Action ── */}
            <button
                type="button"
                onClick={addSession}
                className="group flex items-center gap-3 text-sm font-bold text-primary border-2 border-dashed border-primary/20 rounded-2xl px-4 py-5 w-full justify-center hover:bg-primary/5 hover:border-primary/40 transition-all"
            >
                <div className="p-1 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                    <Plus size={20} />
                </div>
                เพิ่มเนื้อหาบทเรียนใหม่
            </button>

            {sessions.length > 0 && (
                <div className="flex justify-between items-center px-2">
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                        Total Content: {sessions.length} Items
                    </p>
                </div>
            )}
        </div>
    );
}