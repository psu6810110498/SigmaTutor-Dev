"use client";

import { useAuth } from "@/app/context/AuthContext";
import { useState, useEffect, useRef } from "react";
import { siteContentApi, uploadApi } from "@/app/lib/api";
import { Loader2, Plus, Trash2, Upload, Check } from "lucide-react";

// ─── Types ────────────────────────────────────────────────
interface StudentItem { faculty: string; major: string; color: string; image: string | null }
interface StatItem { value: string; label: string }
interface UniversityItem { name: string; abbr: string; bg: string; text: string }
interface TutorItem { name: string; subject: string; desc: string; initial: string; color: string; image: string | null }
interface TestimonialData { quote: string; name: string; faculty: string; image: string | null }
interface FaqItem { q: string; a: string }

const TABS = [
    { id: 'profile', label: 'โปรไฟล์แอดมิน' },
    { id: 'students', label: 'ความสำเร็จลูกศิษย์' },
    { id: 'stats', label: 'สถิติ' },
    { id: 'universities', label: 'มหาวิทยาลัย' },
    { id: 'tutors', label: 'ติวเตอร์' },
    { id: 'testimonial', label: 'Testimonial' },
    { id: 'faqs', label: 'FAQ' },
];

// ─── Reusable image upload button ─────────────────────────
function ImageUploadButton({ currentUrl, onUploaded, folder = 'site' }: {
    currentUrl: string | null;
    onUploaded: (url: string) => void;
    folder?: string;
}) {
    const ref = useRef<HTMLInputElement>(null);
    const [loading, setLoading] = useState(false);

    const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setLoading(true);
        try {
            const res = await uploadApi.uploadImage(file);
            if (res.success) onUploaded(res.url);
        } finally {
            setLoading(false);
            e.target.value = '';
        }
    };

    return (
        <div className="flex items-center gap-3">
            {currentUrl && (
                <img src={currentUrl} alt="" className="w-12 h-12 rounded-full object-cover border border-gray-200" />
            )}
            <button
                type="button"
                onClick={() => ref.current?.click()}
                disabled={loading}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
                {loading ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
                {loading ? 'กำลังอัปโหลด...' : currentUrl ? 'เปลี่ยนรูป' : 'อัปโหลดรูป'}
            </button>
            {currentUrl && (
                <button type="button" onClick={() => onUploaded('')} className="text-xs text-red-500 hover:underline">ลบรูป</button>
            )}
            <input ref={ref} type="file" accept="image/*" className="hidden" onChange={handleFile} />
        </div>
    );
}

// ─── Save button ──────────────────────────────────────────
function SaveButton({ onClick, saving, saved }: { onClick: () => void; saving: boolean; saved: boolean }) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary/90 disabled:opacity-60 transition-colors"
        >
            {saving ? <Loader2 size={14} className="animate-spin" /> : saved ? <Check size={14} /> : null}
            {saving ? 'กำลังบันทึก...' : saved ? 'บันทึกแล้ว!' : 'บันทึก'}
        </button>
    );
}

// ─── Section: Students ────────────────────────────────────
function StudentsTab() {
    const [items, setItems] = useState<StudentItem[]>([]);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        siteContentApi.getSection('students').then((r) => {
            if (r.success && r.data) setItems(r.data as StudentItem[]);
        });
    }, []);

    const update = (i: number, field: keyof StudentItem, val: string | null) =>
        setItems((prev) => prev.map((item, idx) => idx === i ? { ...item, [field]: val } : item));

    const save = async () => {
        setSaving(true);
        await siteContentApi.updateSection('students', items);
        setSaving(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <p className="text-sm text-gray-500">การ์ดความสำเร็จนักเรียน (แสดง 4 ใบบน homepage)</p>
                <button type="button" onClick={() => setItems([...items, { faculty: '', major: '', color: 'from-blue-400 to-indigo-600', image: null }])}
                    className="flex items-center gap-1 text-xs text-primary hover:underline"><Plus size={13} /> เพิ่ม</button>
            </div>
            {items.map((item, i) => (
                <div key={i} className="border border-gray-200 rounded-xl p-4 space-y-3 bg-white">
                    <div className="flex justify-between items-start">
                        <span className="text-xs font-semibold text-gray-500">การ์ดที่ {i + 1}</span>
                        <button type="button" onClick={() => setItems(items.filter((_, idx) => idx !== i))} className="text-red-400 hover:text-red-600"><Trash2 size={14} /></button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs text-gray-600 mb-1">คณะ</label>
                            <input value={item.faculty} onChange={(e) => update(i, 'faculty', e.target.value)} className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-primary/20" />
                        </div>
                        <div>
                            <label className="block text-xs text-gray-600 mb-1">สาขา</label>
                            <input value={item.major} onChange={(e) => update(i, 'major', e.target.value)} className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-primary/20" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs text-gray-600 mb-1">Gradient (Tailwind)</label>
                        <input value={item.color} onChange={(e) => update(i, 'color', e.target.value)} className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg outline-none font-mono" />
                    </div>
                    <div>
                        <label className="block text-xs text-gray-600 mb-1">รูปโปรไฟล์</label>
                        <ImageUploadButton currentUrl={item.image} onUploaded={(url) => update(i, 'image', url || null)} />
                    </div>
                </div>
            ))}
            <SaveButton onClick={save} saving={saving} saved={saved} />
        </div>
    );
}

// ─── Section: Stats ───────────────────────────────────────
function StatsTab() {
    const [items, setItems] = useState<StatItem[]>([]);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        siteContentApi.getSection('stats').then((r) => {
            if (r.success && r.data) setItems(r.data as StatItem[]);
        });
    }, []);

    const update = (i: number, field: keyof StatItem, val: string) =>
        setItems((prev) => prev.map((item, idx) => idx === i ? { ...item, [field]: val } : item));

    const save = async () => {
        setSaving(true);
        await siteContentApi.updateSection('stats', items);
        setSaving(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
    };

    return (
        <div className="space-y-4">
            <p className="text-sm text-gray-500">ตัวเลขสถิติที่แสดงบน homepage</p>
            {items.map((item, i) => (
                <div key={i} className="border border-gray-200 rounded-xl p-4 grid grid-cols-2 gap-3 bg-white">
                    <div>
                        <label className="block text-xs text-gray-600 mb-1">ตัวเลข (เช่น 10,000+)</label>
                        <input value={item.value} onChange={(e) => update(i, 'value', e.target.value)} className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-primary/20 font-bold" />
                    </div>
                    <div>
                        <label className="block text-xs text-gray-600 mb-1">คำอธิบาย</label>
                        <input value={item.label} onChange={(e) => update(i, 'label', e.target.value)} className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-primary/20" />
                    </div>
                </div>
            ))}
            <SaveButton onClick={save} saving={saving} saved={saved} />
        </div>
    );
}

// ─── Section: Universities ────────────────────────────────
function UniversitiesTab() {
    const [items, setItems] = useState<UniversityItem[]>([]);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        siteContentApi.getSection('universities').then((r) => {
            if (r.success && r.data) setItems(r.data as UniversityItem[]);
        });
    }, []);

    const update = (i: number, field: keyof UniversityItem, val: string) =>
        setItems((prev) => prev.map((item, idx) => idx === i ? { ...item, [field]: val } : item));

    const save = async () => {
        setSaving(true);
        await siteContentApi.updateSection('universities', items);
        setSaving(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <p className="text-sm text-gray-500">รายชื่อมหาวิทยาลัยที่ศิษย์เก่าสอบติด</p>
                <button type="button" onClick={() => setItems([...items, { name: '', abbr: '', bg: 'bg-gray-100', text: 'text-gray-600' }])}
                    className="flex items-center gap-1 text-xs text-primary hover:underline"><Plus size={13} /> เพิ่ม</button>
            </div>
            {items.map((item, i) => (
                <div key={i} className="border border-gray-200 rounded-xl p-4 bg-white">
                    <div className="flex justify-between mb-3">
                        <span className="text-xs font-semibold text-gray-500">#{i + 1}</span>
                        <button type="button" onClick={() => setItems(items.filter((_, idx) => idx !== i))} className="text-red-400 hover:text-red-600"><Trash2 size={14} /></button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs text-gray-600 mb-1">ชื่อ</label>
                            <input value={item.name} onChange={(e) => update(i, 'name', e.target.value)} className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-primary/20" />
                        </div>
                        <div>
                            <label className="block text-xs text-gray-600 mb-1">ตัวย่อ</label>
                            <input value={item.abbr} onChange={(e) => update(i, 'abbr', e.target.value)} className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg outline-none font-mono" />
                        </div>
                        <div>
                            <label className="block text-xs text-gray-600 mb-1">Bg class (Tailwind)</label>
                            <input value={item.bg} onChange={(e) => update(i, 'bg', e.target.value)} className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg outline-none font-mono" />
                        </div>
                        <div>
                            <label className="block text-xs text-gray-600 mb-1">Text class (Tailwind)</label>
                            <input value={item.text} onChange={(e) => update(i, 'text', e.target.value)} className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg outline-none font-mono" />
                        </div>
                    </div>
                </div>
            ))}
            <SaveButton onClick={save} saving={saving} saved={saved} />
        </div>
    );
}

// ─── Section: Tutors ──────────────────────────────────────
function TutorsTab() {
    const [items, setItems] = useState<TutorItem[]>([]);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        siteContentApi.getSection('tutors').then((r) => {
            if (r.success && r.data) setItems(r.data as TutorItem[]);
        });
    }, []);

    const update = (i: number, field: keyof TutorItem, val: string | null) =>
        setItems((prev) => prev.map((item, idx) => idx === i ? { ...item, [field]: val } : item));

    const save = async () => {
        setSaving(true);
        await siteContentApi.updateSection('tutors', items);
        setSaving(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <p className="text-sm text-gray-500">การ์ดติวเตอร์ที่แสดงบน homepage</p>
                <button type="button" onClick={() => setItems([...items, { name: '', subject: '', desc: '', initial: '', color: 'from-blue-500 to-indigo-600', image: null }])}
                    className="flex items-center gap-1 text-xs text-primary hover:underline"><Plus size={13} /> เพิ่ม</button>
            </div>
            {items.map((item, i) => (
                <div key={i} className="border border-gray-200 rounded-xl p-4 space-y-3 bg-white">
                    <div className="flex justify-between">
                        <span className="text-xs font-semibold text-gray-500">ติวเตอร์ที่ {i + 1}</span>
                        <button type="button" onClick={() => setItems(items.filter((_, idx) => idx !== i))} className="text-red-400 hover:text-red-600"><Trash2 size={14} /></button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs text-gray-600 mb-1">ชื่อ</label>
                            <input value={item.name} onChange={(e) => update(i, 'name', e.target.value)} className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-primary/20" />
                        </div>
                        <div>
                            <label className="block text-xs text-gray-600 mb-1">วิชา</label>
                            <input value={item.subject} onChange={(e) => update(i, 'subject', e.target.value)} className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-primary/20" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs text-gray-600 mb-1">คำอธิบาย</label>
                        <textarea value={item.desc} onChange={(e) => update(i, 'desc', e.target.value)} rows={2} className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-primary/20 resize-none" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs text-gray-600 mb-1">ตัวอักษรย่อ (fallback)</label>
                            <input value={item.initial} onChange={(e) => update(i, 'initial', e.target.value)} maxLength={2} className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg outline-none font-bold" />
                        </div>
                        <div>
                            <label className="block text-xs text-gray-600 mb-1">Gradient (Tailwind)</label>
                            <input value={item.color} onChange={(e) => update(i, 'color', e.target.value)} className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg outline-none font-mono" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs text-gray-600 mb-1">รูปโปรไฟล์</label>
                        <ImageUploadButton currentUrl={item.image} onUploaded={(url) => update(i, 'image', url || null)} />
                    </div>
                </div>
            ))}
            <SaveButton onClick={save} saving={saving} saved={saved} />
        </div>
    );
}

// ─── Section: Testimonial ─────────────────────────────────
function TestimonialTab() {
    const [data, setData] = useState<TestimonialData>({ quote: '', name: '', faculty: '', image: null });
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        siteContentApi.getSection('testimonial').then((r) => {
            if (r.success && r.data) setData(r.data as TestimonialData);
        });
    }, []);

    const save = async () => {
        setSaving(true);
        await siteContentApi.updateSection('testimonial', data);
        setSaving(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
    };

    return (
        <div className="space-y-4 bg-white border border-gray-200 rounded-xl p-5">
            <p className="text-sm text-gray-500">คำรีวิวที่แสดงใน section Testimonial</p>
            <div>
                <label className="block text-xs text-gray-600 mb-1">คำพูด (quote)</label>
                <textarea value={data.quote} onChange={(e) => setData({ ...data, quote: e.target.value })} rows={3} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-primary/20 resize-none" />
            </div>
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="block text-xs text-gray-600 mb-1">ชื่อผู้รีวิว</label>
                    <input value={data.name} onChange={(e) => setData({ ...data, name: e.target.value })} className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
                <div>
                    <label className="block text-xs text-gray-600 mb-1">คณะ/สาขา</label>
                    <input value={data.faculty} onChange={(e) => setData({ ...data, faculty: e.target.value })} className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
            </div>
            <div>
                <label className="block text-xs text-gray-600 mb-1">รูปโปรไฟล์</label>
                <ImageUploadButton currentUrl={data.image} onUploaded={(url) => setData({ ...data, image: url || null })} />
            </div>
            <SaveButton onClick={save} saving={saving} saved={saved} />
        </div>
    );
}

// ─── Section: FAQs ────────────────────────────────────────
function FaqsTab() {
    const [items, setItems] = useState<FaqItem[]>([]);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        siteContentApi.getSection('faqs').then((r) => {
            if (r.success && r.data) setItems(r.data as FaqItem[]);
        });
    }, []);

    const update = (i: number, field: keyof FaqItem, val: string) =>
        setItems((prev) => prev.map((item, idx) => idx === i ? { ...item, [field]: val } : item));

    const save = async () => {
        setSaving(true);
        await siteContentApi.updateSection('faqs', items);
        setSaving(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <p className="text-sm text-gray-500">คำถามที่พบบ่อย (FAQ)</p>
                <button type="button" onClick={() => setItems([...items, { q: '', a: '' }])}
                    className="flex items-center gap-1 text-xs text-primary hover:underline"><Plus size={13} /> เพิ่มคำถาม</button>
            </div>
            {items.map((item, i) => (
                <div key={i} className="border border-gray-200 rounded-xl p-4 space-y-3 bg-white">
                    <div className="flex justify-between">
                        <span className="text-xs font-semibold text-gray-500">คำถามที่ {i + 1}</span>
                        <button type="button" onClick={() => setItems(items.filter((_, idx) => idx !== i))} className="text-red-400 hover:text-red-600"><Trash2 size={14} /></button>
                    </div>
                    <div>
                        <label className="block text-xs text-gray-600 mb-1">คำถาม</label>
                        <input value={item.q} onChange={(e) => update(i, 'q', e.target.value)} className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-primary/20" />
                    </div>
                    <div>
                        <label className="block text-xs text-gray-600 mb-1">คำตอบ</label>
                        <textarea value={item.a} onChange={(e) => update(i, 'a', e.target.value)} rows={2} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-primary/20 resize-none" />
                    </div>
                </div>
            ))}
            <SaveButton onClick={save} saving={saving} saved={saved} />
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────
export default function AdminSettingsPage() {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('profile');

    return (
        <div className="space-y-6 max-w-3xl">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">ตั้งค่าบัญชี & หน้าเว็บ</h1>
                <p className="text-sm text-gray-500 mt-1">จัดการเนื้อหาที่แสดงผลบน homepage และข้อมูลแอดมิน</p>
            </div>

            {/* Tab bar */}
            <div className="flex gap-1 flex-wrap border-b border-gray-200">
                {TABS.map((tab) => (
                    <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors border-b-2 -mb-px ${activeTab === tab.id
                                ? 'border-primary text-primary bg-primary/5'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab content */}
            <div>
                {activeTab === 'profile' && (
                    <div className="space-y-6">
                        <div className="bg-white rounded-xl border border-gray-200 p-6">
                            <h2 className="text-base font-bold text-gray-800 mb-4">ข้อมูลส่วนตัว (Admin Profile)</h2>
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold text-2xl">
                                    {user?.name?.charAt(0).toUpperCase() || 'A'}
                                </div>
                                <div>
                                    <p className="font-bold text-gray-900">{user?.name || 'System Admin'}</p>
                                    <p className="text-sm text-gray-500">{user?.email}</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">ชื่อ-นามสกุล</label>
                                    <input type="text" className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" defaultValue={user?.name || ''} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">อีเมล (ใช้ล็อกอิน)</label>
                                    <input type="email" disabled className="w-full px-4 py-2 rounded-lg border border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed outline-none" defaultValue={user?.email || ''} />
                                </div>
                            </div>
                            <button className="mt-4 px-6 py-2 bg-slate-900 text-white font-medium rounded-lg hover:bg-black transition-colors text-sm">
                                อัปเดตโปรไฟล์
                            </button>
                        </div>
                        <div className="bg-white rounded-xl border border-gray-200 p-6">
                            <h2 className="text-base font-bold text-gray-800 mb-4">ตั้งค่าแพลตฟอร์ม</h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">ชื่อแพลตฟอร์ม</label>
                                    <input type="text" className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" defaultValue="Sigma Tutor" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">อีเมลติดต่อ</label>
                                    <input type="email" className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" defaultValue="contact@sigmatutor.com" />
                                </div>
                                <button className="px-6 py-2 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 transition-colors text-sm">
                                    บันทึกการเปลี่ยนแปลง
                                </button>
                            </div>
                        </div>
                    </div>
                )}
                {activeTab === 'students' && <StudentsTab />}
                {activeTab === 'stats' && <StatsTab />}
                {activeTab === 'universities' && <UniversitiesTab />}
                {activeTab === 'tutors' && <TutorsTab />}
                {activeTab === 'testimonial' && <TestimonialTab />}
                {activeTab === 'faqs' && <FaqsTab />}
            </div>
        </div>
    );
}
