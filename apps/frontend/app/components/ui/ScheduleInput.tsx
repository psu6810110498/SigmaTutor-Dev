'use client';

import { useState } from 'react';
import { Plus, Trash2, Calendar } from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────

export type CourseType = 'ONLINE' | 'ONLINE_LIVE' | 'ONSITE';

export interface ScheduleSession {
    id: string;          // local uuid for key
    title: string;       // หัวข้อ
    date?: string;       // ISO date string (LIVE / ONSITE)
    startTime?: string;  // HH:MM
    endTime?: string;    // HH:MM
    location?: string;   // ห้อง / สถานที่ (ONSITE)
    zoomLink?: string;   // Zoom URL (ONLINE_LIVE)
    videoUrl?: string;   // VDO URL (ONLINE)
}

interface ScheduleInputProps {
    courseType: CourseType;
    value: ScheduleSession[];
    onChange: (sessions: ScheduleSession[]) => void;
}

// ── Helpers ────────────────────────────────────────────────────

let _id = 0;
const newId = () => `s${Date.now()}${++_id}`;

const emptySession = (courseType: CourseType): ScheduleSession => ({
    id: newId(),
    title: '',
    ...(courseType !== 'ONLINE' && { date: '', startTime: '09:00', endTime: '12:00' }),
    ...(courseType === 'ONSITE' && { location: '' }),
    ...(courseType === 'ONLINE_LIVE' && { zoomLink: '' }),
    ...(courseType === 'ONLINE' && { videoUrl: '' }),
});

// ── Column config per type ─────────────────────────────────────

const inputBase =
    'w-full h-9 px-2 text-sm rounded-md border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all';

// ── Main Component ─────────────────────────────────────────────

export function ScheduleInput({ courseType, value, onChange }: ScheduleInputProps) {
    const sessions = value;

    const addSession = () => onChange([...sessions, emptySession(courseType)]);

    const removeSession = (id: string) =>
        onChange(sessions.filter((s) => s.id !== id));

    const updateSession = (id: string, field: keyof ScheduleSession, val: string) =>
        onChange(sessions.map((s) => (s.id === id ? { ...s, [field]: val } : s)));

    const isLive = courseType === 'ONLINE_LIVE';
    const isOnsite = courseType === 'ONSITE';
    const isOnline = courseType === 'ONLINE';

    return (
        <div className="space-y-4">
            {sessions.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-xl">
                    <Calendar size={28} className="mx-auto mb-2 text-gray-300" />
                    <p className="text-sm text-gray-500">ยังไม่มีตารางเรียน</p>
                    <p className="text-xs text-gray-400 mt-0.5">กด "+ เพิ่มคลาส" เพื่อเริ่มกำหนดตาราง</p>
                </div>
            ) : (
                <>
                    {/* ── Desktop Table ── */}
                    <div className="hidden sm:block overflow-x-auto">
                        <table className="w-full text-sm border-collapse">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-100">
                                    <th className="px-3 py-2.5 text-left font-semibold text-gray-600 w-12">#</th>
                                    {(isLive || isOnsite) && (
                                        <>
                                            <th className="px-3 py-2.5 text-left font-semibold text-gray-600 w-36">วันที่</th>
                                            <th className="px-3 py-2.5 text-left font-semibold text-gray-600 w-28">เวลา</th>
                                        </>
                                    )}
                                    <th className="px-3 py-2.5 text-left font-semibold text-gray-600">หัวข้อ</th>
                                    {isOnsite && (
                                        <th className="px-3 py-2.5 text-left font-semibold text-gray-600 w-36">สถานที่/ห้อง</th>
                                    )}
                                    {isLive && (
                                        <th className="px-3 py-2.5 text-left font-semibold text-gray-600 w-48">Zoom Link</th>
                                    )}
                                    {isOnline && (
                                        <th className="px-3 py-2.5 text-left font-semibold text-gray-600 w-48">ลิงก์วิดีโอ (optional)</th>
                                    )}
                                    <th className="px-3 py-2.5 w-10" />
                                </tr>
                            </thead>
                            <tbody>
                                {sessions.map((s, idx) => (
                                    <tr
                                        key={s.id}
                                        className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors"
                                    >
                                        <td className="px-3 py-2 text-gray-400 font-mono font-medium">
                                            {idx + 1}
                                        </td>

                                        {(isLive || isOnsite) && (
                                            <>
                                                <td className="px-3 py-2">
                                                    <input
                                                        type="date"
                                                        value={s.date || ''}
                                                        onChange={(e) => updateSession(s.id, 'date', e.target.value)}
                                                        className={inputBase}
                                                    />
                                                </td>
                                                <td className="px-3 py-2">
                                                    <div className="flex items-center gap-1">
                                                        <input
                                                            type="time"
                                                            value={s.startTime || '09:00'}
                                                            onChange={(e) => updateSession(s.id, 'startTime', e.target.value)}
                                                            className="w-20 h-9 px-1.5 text-sm rounded-md border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                                                        />
                                                        <span className="text-gray-400 text-xs">-</span>
                                                        <input
                                                            type="time"
                                                            value={s.endTime || '12:00'}
                                                            onChange={(e) => updateSession(s.id, 'endTime', e.target.value)}
                                                            className="w-20 h-9 px-1.5 text-sm rounded-md border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                                                        />
                                                    </div>
                                                </td>
                                            </>
                                        )}

                                        <td className="px-3 py-2">
                                            <input
                                                type="text"
                                                value={s.title}
                                                onChange={(e) => updateSession(s.id, 'title', e.target.value)}
                                                placeholder="ชื่อหัวข้อ…"
                                                className={inputBase}
                                            />
                                        </td>

                                        {isOnsite && (
                                            <td className="px-3 py-2">
                                                <input
                                                    type="text"
                                                    value={s.location || ''}
                                                    onChange={(e) => updateSession(s.id, 'location', e.target.value)}
                                                    placeholder="ห้อง 201…"
                                                    className={inputBase}
                                                />
                                            </td>
                                        )}

                                        {isLive && (
                                            <td className="px-3 py-2">
                                                <input
                                                    type="url"
                                                    value={s.zoomLink || ''}
                                                    onChange={(e) => updateSession(s.id, 'zoomLink', e.target.value)}
                                                    placeholder="https://zoom.us/j/…"
                                                    className={inputBase}
                                                />
                                            </td>
                                        )}

                                        {isOnline && (
                                            <td className="px-3 py-2">
                                                <input
                                                    type="url"
                                                    value={s.videoUrl || ''}
                                                    onChange={(e) => updateSession(s.id, 'videoUrl', e.target.value)}
                                                    placeholder="https://…"
                                                    className={inputBase}
                                                />
                                            </td>
                                        )}

                                        <td className="px-3 py-2">
                                            <button
                                                type="button"
                                                onClick={() => removeSession(s.id)}
                                                className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                                            >
                                                <Trash2 size={15} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* ── Mobile Cards ── */}
                    <div className="sm:hidden space-y-3">
                        {sessions.map((s, idx) => (
                            <div
                                key={s.id}
                                className="border border-gray-200 rounded-xl p-4 bg-white space-y-3 shadow-sm"
                            >
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-primary bg-primary/10 rounded-full px-2.5 py-0.5">
                                        ครั้งที่ {idx + 1}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => removeSession(s.id)}
                                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">หัวข้อ</label>
                                    <input
                                        type="text"
                                        value={s.title}
                                        onChange={(e) => updateSession(s.id, 'title', e.target.value)}
                                        placeholder="ชื่อหัวข้อ…"
                                        className={inputBase}
                                    />
                                </div>

                                {(isLive || isOnsite) && (
                                    <>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 mb-1">วันที่</label>
                                            <input
                                                type="date"
                                                value={s.date || ''}
                                                onChange={(e) => updateSession(s.id, 'date', e.target.value)}
                                                className={inputBase}
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <label className="block text-xs font-medium text-gray-500 mb-1">เริ่ม</label>
                                                <input
                                                    type="time"
                                                    value={s.startTime || '09:00'}
                                                    onChange={(e) => updateSession(s.id, 'startTime', e.target.value)}
                                                    className={inputBase}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-500 mb-1">สิ้นสุด</label>
                                                <input
                                                    type="time"
                                                    value={s.endTime || '12:00'}
                                                    onChange={(e) => updateSession(s.id, 'endTime', e.target.value)}
                                                    className={inputBase}
                                                />
                                            </div>
                                        </div>
                                    </>
                                )}

                                {isOnsite && (
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 mb-1">สถานที่/ห้อง</label>
                                        <input
                                            type="text"
                                            value={s.location || ''}
                                            onChange={(e) => updateSession(s.id, 'location', e.target.value)}
                                            placeholder="ห้อง 201…"
                                            className={inputBase}
                                        />
                                    </div>
                                )}

                                {isLive && (
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 mb-1">Zoom Link</label>
                                        <input
                                            type="url"
                                            value={s.zoomLink || ''}
                                            onChange={(e) => updateSession(s.id, 'zoomLink', e.target.value)}
                                            placeholder="https://zoom.us/j/…"
                                            className={inputBase}
                                        />
                                    </div>
                                )}

                                {isOnline && (
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 mb-1">ลิงก์วิดีโอ (optional)</label>
                                        <input
                                            type="url"
                                            value={s.videoUrl || ''}
                                            onChange={(e) => updateSession(s.id, 'videoUrl', e.target.value)}
                                            placeholder="https://…"
                                            className={inputBase}
                                        />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </>
            )}

            {/* Add Row Button */}
            <button
                type="button"
                onClick={addSession}
                className="flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 hover:bg-primary/5 border border-dashed border-primary/30 hover:border-primary/60 rounded-xl px-4 py-2.5 w-full justify-center transition-all"
            >
                <Plus size={16} />
                + เพิ่มคลาส
            </button>

            {sessions.length > 0 && (
                <p className="text-xs text-gray-400 text-right">
                    {sessions.length} คลาส
                </p>
            )}
        </div>
    );
}
