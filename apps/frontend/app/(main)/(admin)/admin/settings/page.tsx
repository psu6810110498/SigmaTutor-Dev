'use client';

import { useAuth } from '@/app/context/AuthContext';
import { useState, useEffect, useRef, useCallback } from 'react';
import { siteContentApi, uploadApi, userApi } from '@/app/lib/api';
import { Loader2, Plus, Trash2, Upload, Check, AlertTriangle } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────
interface StudentItem {
  faculty: string;
  major: string;
  color: string;
  image: string | null;
}
interface StatItem {
  value: string;
  label: string;
}
interface UniversityItem {
  name: string;
  abbr: string;
  bg: string;
  text: string;
  image: string | null;
}
interface TutorItem {
  name: string;
  subject: string;
  desc: string;
  initial: string;
  color: string;
  image: string | null;
}
interface TestimonialData {
  quote: string;
  name: string;
  faculty: string;
  image: string | null;
}
interface FaqItem {
  q: string;
  a: string;
}

interface TabBaseProps {
  onDirtyChange: (dirty: boolean) => void;
  registerSave: (fn: (() => Promise<void>) | null) => void;
}

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
function ImageUploadButton({
  currentUrl,
  onUploaded,
  folder = 'site',
}: {
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
        <img
          src={currentUrl}
          alt=""
          className="w-12 h-12 rounded-full object-cover border border-gray-200"
        />
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
        <button
          type="button"
          onClick={() => onUploaded('')}
          className="text-xs text-red-500 hover:underline"
        >
          ลบรูป
        </button>
      )}
      <input ref={ref} type="file" accept="image/*" className="hidden" onChange={handleFile} />
    </div>
  );
}

// ─── Unsaved changes dialog ────────────────────────────────
function UnsavedDialog({
  onSave,
  onDiscard,
  onCancel,
  saving,
}: {
  onSave: () => void;
  onDiscard: () => void;
  onCancel: () => void;
  saving: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6 space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
            <AlertTriangle size={20} className="text-amber-600" />
          </div>
          <div>
            <p className="font-bold text-gray-900 text-base">มีการเปลี่ยนแปลงที่ยังไม่ได้บันทึก</p>
            <p className="text-sm text-gray-500 mt-1">
              คุณต้องการบันทึกการเปลี่ยนแปลงก่อนออกจากหน้านี้หรือไม่?
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-2 pt-1">
          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 disabled:opacity-60 transition-colors"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : null}
            {saving ? 'กำลังบันทึก...' : 'บันทึกและออก'}
          </button>
          <button
            type="button"
            onClick={onDiscard}
            className="w-full px-4 py-2.5 text-sm font-medium text-red-600 rounded-xl hover:bg-red-50 transition-colors"
          >
            ออกโดยไม่บันทึก
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="w-full px-4 py-2.5 text-sm font-medium text-gray-600 rounded-xl hover:bg-gray-100 transition-colors"
          >
            ยกเลิก
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Sticky save bar ───────────────────────────────────────
function StickySaveBar({
  isDirty,
  saving,
  saved,
  onSave,
}: {
  isDirty: boolean;
  saving: boolean;
  saved: boolean;
  onSave: () => void;
}) {
  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-40 transition-all duration-300 ${
        isDirty ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0 pointer-events-none'
      }`}
    >
      <div className="flex items-center justify-between gap-4 px-6 py-3 bg-white border-t border-amber-200 shadow-[0_-4px_24px_rgba(0,0,0,0.08)] max-w-3xl mx-auto rounded-t-2xl">
        <div className="flex items-center gap-2 text-sm text-amber-700">
          <AlertTriangle size={15} className="shrink-0" />
          <span>มีการเปลี่ยนแปลงที่ยังไม่ได้บันทึก</span>
        </div>
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary/90 disabled:opacity-60 transition-colors shrink-0"
        >
          {saving ? (
            <Loader2 size={14} className="animate-spin" />
          ) : saved ? (
            <Check size={14} />
          ) : null}
          {saving ? 'กำลังบันทึก...' : saved ? 'บันทึกแล้ว!' : 'บันทึก'}
        </button>
      </div>
    </div>
  );
}

// ─── Section: Profile ───────────────────────────────────
interface PlatformSettings {
  name: string;
  contactEmail: string;
}

function ProfileTab({ onDirtyChange, registerSave }: TabBaseProps) {
  const { user, login } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [profileImage, setProfileImage] = useState<string | null>(user?.profileImage || null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savedProfile, setSavedProfile] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setProfileImage(user.profileImage || null);
    }
  }, [user]);

  const markDirty = useCallback(() => onDirtyChange(true), [onDirtyChange]);

  const [platform, setPlatform] = useState<PlatformSettings>({
    name: 'Sigma Tutor',
    contactEmail: 'contact@sigmatutor.com',
  });
  const [savingPlatform, setSavingPlatform] = useState(false);
  const [savedPlatform, setSavedPlatform] = useState(false);

  useEffect(() => {
    siteContentApi.getSection('platform').then((r) => {
      if (r.success && r.data) setPlatform(r.data as PlatformSettings);
    });
  }, []);

  const saveProfile = useCallback(async () => {
    if (!user) return;
    setSavingProfile(true);
    await userApi.update(user.id, { name, profileImage: profileImage || undefined });
    setSavingProfile(false);
    login({ ...user, name, profileImage: profileImage || undefined });
    setSavedProfile(true);
    setTimeout(() => setSavedProfile(false), 2500);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, profileImage, user]);

  const savePlatform = useCallback(async () => {
    setSavingPlatform(true);
    await siteContentApi.updateSection('platform', platform);
    setSavingPlatform(false);
    setSavedPlatform(true);
    setTimeout(() => setSavedPlatform(false), 2500);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [platform]);

  const saveAll = useCallback(async () => {
    await Promise.all([saveProfile(), savePlatform()]);
    onDirtyChange(false);
  }, [saveProfile, savePlatform, onDirtyChange]);

  const saveAllRef = useRef(saveAll);
  saveAllRef.current = saveAll;

  useEffect(() => {
    registerSave(() => saveAllRef.current());
    return () => registerSave(null);
  }, [registerSave]);

  return (
    <div className="space-y-6 pb-20">
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-base font-bold text-gray-800 mb-4">ข้อมูลส่วนตัว (Admin Profile)</h2>
        <div className="flex items-center gap-4 mb-6">
          {profileImage ? (
            <img
              src={profileImage}
              alt=""
              className="w-16 h-16 rounded-full object-cover border border-gray-200"
            />
          ) : (
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold text-2xl">
              {name?.charAt(0).toUpperCase() || 'A'}
            </div>
          )}
          <div>
            <p className="font-bold text-gray-900">{name || 'System Admin'}</p>
            <p className="text-sm text-gray-500">{user?.email}</p>
          </div>
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">รูปโปรไฟล์</label>
          <ImageUploadButton
            currentUrl={profileImage}
            onUploaded={(url) => {
              setProfileImage(url || null);
              markDirty();
            }}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">ชื่อ-นามสกุล</label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                markDirty();
              }}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              อีเมล (ใช้ล็อกอิน)
            </label>
            <input
              type="email"
              disabled
              value={user?.email || ''}
              className="w-full px-4 py-2 rounded-lg border border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed outline-none"
            />
          </div>
        </div>
        <div className="mt-4">
          <button
            type="button"
            onClick={async () => {
              await saveProfile();
              onDirtyChange(false);
            }}
            disabled={savingProfile}
            className="flex items-center gap-2 px-5 py-2 bg-slate-900 text-white text-sm font-semibold rounded-lg hover:bg-black disabled:opacity-60 transition-colors"
          >
            {savingProfile ? (
              <Loader2 size={14} className="animate-spin" />
            ) : savedProfile ? (
              <Check size={14} />
            ) : null}
            {savingProfile ? 'กำลังบันทึก...' : savedProfile ? 'บันทึกแล้ว!' : 'อัปเดตโปรไฟล์'}
          </button>
        </div>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-base font-bold text-gray-800 mb-4">ตั้งค่าแพลตฟอร์ม</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">ชื่อแพลตฟอร์ม</label>
            <input
              type="text"
              value={platform.name}
              onChange={(e) => {
                setPlatform({ ...platform, name: e.target.value });
                markDirty();
              }}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">อีเมลติดต่อ</label>
            <input
              type="email"
              value={platform.contactEmail}
              onChange={(e) => {
                setPlatform({ ...platform, contactEmail: e.target.value });
                markDirty();
              }}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
            />
          </div>
          <button
            type="button"
            onClick={async () => {
              await savePlatform();
              onDirtyChange(false);
            }}
            disabled={savingPlatform}
            className="flex items-center gap-2 px-5 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary/90 disabled:opacity-60 transition-colors"
          >
            {savingPlatform ? (
              <Loader2 size={14} className="animate-spin" />
            ) : savedPlatform ? (
              <Check size={14} />
            ) : null}
            {savingPlatform
              ? 'กำลังบันทึก...'
              : savedPlatform
                ? 'บันทึกแล้ว!'
                : 'บันทึกการเปลี่ยนแปลง'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Section: Students ────────────────────────────────────
function StudentsTab({ onDirtyChange, registerSave }: TabBaseProps) {
  const [items, setItems] = useState<StudentItem[]>([]);

  useEffect(() => {
    siteContentApi.getSection('students').then((r) => {
      if (r.success && r.data) setItems(r.data as StudentItem[]);
    });
  }, []);

  const update = (i: number, field: keyof StudentItem, val: string | null) => {
    setItems((prev) => prev.map((item, idx) => (idx === i ? { ...item, [field]: val } : item)));
    onDirtyChange(true);
  };

  const save = useCallback(async () => {
    await siteContentApi.updateSection('students', items);
    onDirtyChange(false);
  }, [items, onDirtyChange]);

  const saveFnRef = useRef(save);
  saveFnRef.current = save;

  useEffect(() => {
    registerSave(() => saveFnRef.current());
    return () => registerSave(null);
  }, [registerSave]);

  return (
    <div className="space-y-4 pb-20">
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-500">การ์ดความสำเร็จนักเรียน (แสดง 4 ใบบน homepage)</p>
        <button
          type="button"
          onClick={() => {
            setItems([
              ...items,
              { faculty: '', major: '', color: 'from-blue-400 to-indigo-600', image: null },
            ]);
            onDirtyChange(true);
          }}
          className="flex items-center gap-1 text-xs text-primary hover:underline"
        >
          <Plus size={13} /> เพิ่ม
        </button>
      </div>
      {items.map((item, i) => (
        <div key={i} className="border border-gray-200 rounded-xl p-4 space-y-3 bg-white">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-gray-500">การ์ดที่ {i + 1}</span>
            <button
              type="button"
              onClick={() => {
                setItems(items.filter((_, idx) => idx !== i));
                onDirtyChange(true);
              }}
              className="text-red-400 hover:text-red-600"
            >
              <Trash2 size={14} />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">คณะ</label>
              <input
                value={item.faculty}
                onChange={(e) => update(i, 'faculty', e.target.value)}
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">สาขา</label>
              <input
                value={item.major}
                onChange={(e) => update(i, 'major', e.target.value)}
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Gradient (Tailwind)</label>
            <input
              value={item.color}
              onChange={(e) => update(i, 'color', e.target.value)}
              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg outline-none font-mono"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">รูปโปรไฟล์</label>
            <ImageUploadButton
              currentUrl={item.image}
              onUploaded={(url) => update(i, 'image', url || null)}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Section: Stats ───────────────────────────────────────
function StatsTab({ onDirtyChange, registerSave }: TabBaseProps) {
  const [items, setItems] = useState<StatItem[]>([]);

  useEffect(() => {
    siteContentApi.getSection('stats').then((r) => {
      if (r.success && r.data) setItems(r.data as StatItem[]);
    });
  }, []);

  const update = (i: number, field: keyof StatItem, val: string) => {
    setItems((prev) => prev.map((item, idx) => (idx === i ? { ...item, [field]: val } : item)));
    onDirtyChange(true);
  };

  const save = useCallback(async () => {
    await siteContentApi.updateSection('stats', items);
    onDirtyChange(false);
  }, [items, onDirtyChange]);

  const saveFnRef = useRef(save);
  saveFnRef.current = save;

  useEffect(() => {
    registerSave(() => saveFnRef.current());
    return () => registerSave(null);
  }, [registerSave]);

  return (
    <div className="space-y-4 pb-20">
      <p className="text-sm text-gray-500">ตัวเลขสถิติที่แสดงบน homepage</p>
      {items.map((item, i) => (
        <div
          key={i}
          className="border border-gray-200 rounded-xl p-4 grid grid-cols-2 gap-3 bg-white"
        >
          <div>
            <label className="block text-xs text-gray-600 mb-1">ตัวเลข (เช่น 10,000+)</label>
            <input
              value={item.value}
              onChange={(e) => update(i, 'value', e.target.value)}
              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-primary/20 font-bold"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">คำอธิบาย</label>
            <input
              value={item.label}
              onChange={(e) => update(i, 'label', e.target.value)}
              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Section: Universities ────────────────────────────────
function UniversitiesTab({ onDirtyChange, registerSave }: TabBaseProps) {
  const [items, setItems] = useState<UniversityItem[]>([]);

  useEffect(() => {
    siteContentApi.getSection('universities').then((r) => {
      if (r.success && r.data) setItems(r.data as UniversityItem[]);
    });
  }, []);

  const update = (i: number, field: keyof UniversityItem, val: string | null) => {
    setItems((prev) => prev.map((item, idx) => (idx === i ? { ...item, [field]: val } : item)));
    onDirtyChange(true);
  };

  const save = useCallback(async () => {
    await siteContentApi.updateSection('universities', items);
    onDirtyChange(false);
  }, [items, onDirtyChange]);

  const saveFnRef = useRef(save);
  saveFnRef.current = save;

  useEffect(() => {
    registerSave(() => saveFnRef.current());
    return () => registerSave(null);
  }, [registerSave]);

  return (
    <div className="space-y-4 pb-20">
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-500">รายชื่อมหาวิทยาลัยที่ศิษย์เก่าสอบติด</p>
        <button
          type="button"
          onClick={() => {
            setItems([
              ...items,
              { name: '', abbr: '', bg: 'bg-gray-100', text: 'text-gray-600', image: null },
            ]);
            onDirtyChange(true);
          }}
          className="flex items-center gap-1 text-xs text-primary hover:underline"
        >
          <Plus size={13} /> เพิ่ม
        </button>
      </div>
      {items.map((item, i) => (
        <div key={i} className="border border-gray-200 rounded-xl p-4 bg-white">
          <div className="flex justify-between mb-3">
            <span className="text-xs font-semibold text-gray-500">#{i + 1}</span>
            <button
              type="button"
              onClick={() => {
                setItems(items.filter((_, idx) => idx !== i));
                onDirtyChange(true);
              }}
              className="text-red-400 hover:text-red-600"
            >
              <Trash2 size={14} />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">ชื่อ</label>
              <input
                value={item.name}
                onChange={(e) => update(i, 'name', e.target.value)}
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">ตัวย่อ</label>
              <input
                value={item.abbr}
                onChange={(e) => update(i, 'abbr', e.target.value)}
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg outline-none font-mono"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Bg class (Tailwind)</label>
              <input
                value={item.bg}
                onChange={(e) => update(i, 'bg', e.target.value)}
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg outline-none font-mono"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Text class (Tailwind)</label>
              <input
                value={item.text}
                onChange={(e) => update(i, 'text', e.target.value)}
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg outline-none font-mono"
              />
            </div>
          </div>
          <div className="mt-3">
            <label className="block text-xs text-gray-600 mb-1">โลโก้มหาวิทยาลัย</label>
            <ImageUploadButton
              currentUrl={item.image}
              onUploaded={(url) => update(i, 'image', url || null)}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Section: Tutors ──────────────────────────────────────
function TutorsTab({ onDirtyChange, registerSave }: TabBaseProps) {
  const [items, setItems] = useState<TutorItem[]>([]);

  useEffect(() => {
    siteContentApi.getSection('tutors').then((r) => {
      if (r.success && r.data) setItems(r.data as TutorItem[]);
    });
  }, []);

  const update = (i: number, field: keyof TutorItem, val: string | null) => {
    setItems((prev) => prev.map((item, idx) => (idx === i ? { ...item, [field]: val } : item)));
    onDirtyChange(true);
  };

  const save = useCallback(async () => {
    await siteContentApi.updateSection('tutors', items);
    onDirtyChange(false);
  }, [items, onDirtyChange]);

  const saveFnRef = useRef(save);
  saveFnRef.current = save;

  useEffect(() => {
    registerSave(() => saveFnRef.current());
    return () => registerSave(null);
  }, [registerSave]);

  return (
    <div className="space-y-4 pb-20">
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-500">การ์ดติวเตอร์ที่แสดงบน homepage</p>
        <button
          type="button"
          onClick={() => {
            setItems([
              ...items,
              {
                name: '',
                subject: '',
                desc: '',
                initial: '',
                color: 'from-blue-500 to-indigo-600',
                image: null,
              },
            ]);
            onDirtyChange(true);
          }}
          className="flex items-center gap-1 text-xs text-primary hover:underline"
        >
          <Plus size={13} /> เพิ่ม
        </button>
      </div>
      {items.map((item, i) => (
        <div key={i} className="border border-gray-200 rounded-xl p-4 space-y-3 bg-white">
          <div className="flex justify-between">
            <span className="text-xs font-semibold text-gray-500">ติวเตอร์ที่ {i + 1}</span>
            <button
              type="button"
              onClick={() => {
                setItems(items.filter((_, idx) => idx !== i));
                onDirtyChange(true);
              }}
              className="text-red-400 hover:text-red-600"
            >
              <Trash2 size={14} />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">ชื่อ</label>
              <input
                value={item.name}
                onChange={(e) => update(i, 'name', e.target.value)}
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">วิชา</label>
              <input
                value={item.subject}
                onChange={(e) => update(i, 'subject', e.target.value)}
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">คำอธิบาย</label>
            <textarea
              value={item.desc}
              onChange={(e) => update(i, 'desc', e.target.value)}
              rows={2}
              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-primary/20 resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">ตัวอักษรย่อ (fallback)</label>
              <input
                value={item.initial}
                onChange={(e) => update(i, 'initial', e.target.value)}
                maxLength={2}
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg outline-none font-bold"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Gradient (Tailwind)</label>
              <input
                value={item.color}
                onChange={(e) => update(i, 'color', e.target.value)}
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg outline-none font-mono"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">รูปโปรไฟล์</label>
            <ImageUploadButton
              currentUrl={item.image}
              onUploaded={(url) => update(i, 'image', url || null)}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Section: Testimonial ─────────────────────────────────
function TestimonialTab({ onDirtyChange, registerSave }: TabBaseProps) {
  const [data, setData] = useState<TestimonialData>({
    quote: '',
    name: '',
    faculty: '',
    image: null,
  });

  useEffect(() => {
    siteContentApi.getSection('testimonial').then((r) => {
      if (r.success && r.data) setData(r.data as TestimonialData);
    });
  }, []);

  const save = useCallback(async () => {
    await siteContentApi.updateSection('testimonial', data);
    onDirtyChange(false);
  }, [data, onDirtyChange]);

  const saveFnRef = useRef(save);
  saveFnRef.current = save;

  useEffect(() => {
    registerSave(() => saveFnRef.current());
    return () => registerSave(null);
  }, [registerSave]);

  return (
    <div className="space-y-4 bg-white border border-gray-200 rounded-xl p-5 pb-20">
      <p className="text-sm text-gray-500">คำรีวิวที่แสดงใน section Testimonial</p>
      <div>
        <label className="block text-xs text-gray-600 mb-1">คำพูด (quote)</label>
        <textarea
          value={data.quote}
          onChange={(e) => {
            setData({ ...data, quote: e.target.value });
            onDirtyChange(true);
          }}
          rows={3}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-primary/20 resize-none"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-gray-600 mb-1">ชื่อผู้รีวิว</label>
          <input
            value={data.name}
            onChange={(e) => {
              setData({ ...data, name: e.target.value });
              onDirtyChange(true);
            }}
            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">คณะ/สาขา</label>
          <input
            value={data.faculty}
            onChange={(e) => {
              setData({ ...data, faculty: e.target.value });
              onDirtyChange(true);
            }}
            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>
      <div>
        <label className="block text-xs text-gray-600 mb-1">รูปโปรไฟล์</label>
        <ImageUploadButton
          currentUrl={data.image}
          onUploaded={(url) => {
            setData({ ...data, image: url || null });
            onDirtyChange(true);
          }}
        />
      </div>
    </div>
  );
}

// ─── Section: FAQs ────────────────────────────────────────
function FaqsTab({ onDirtyChange, registerSave }: TabBaseProps) {
  const [items, setItems] = useState<FaqItem[]>([]);

  useEffect(() => {
    siteContentApi.getSection('faqs').then((r) => {
      if (r.success && r.data) setItems(r.data as FaqItem[]);
    });
  }, []);

  const update = (i: number, field: keyof FaqItem, val: string) => {
    setItems((prev) => prev.map((item, idx) => (idx === i ? { ...item, [field]: val } : item)));
    onDirtyChange(true);
  };

  const save = useCallback(async () => {
    await siteContentApi.updateSection('faqs', items);
    onDirtyChange(false);
  }, [items, onDirtyChange]);

  const saveFnRef = useRef(save);
  saveFnRef.current = save;

  useEffect(() => {
    registerSave(() => saveFnRef.current());
    return () => registerSave(null);
  }, [registerSave]);

  return (
    <div className="space-y-4 pb-20">
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-500">คำถามที่พบบ่อย (FAQ)</p>
        <button
          type="button"
          onClick={() => {
            setItems([...items, { q: '', a: '' }]);
            onDirtyChange(true);
          }}
          className="flex items-center gap-1 text-xs text-primary hover:underline"
        >
          <Plus size={13} /> เพิ่มคำถาม
        </button>
      </div>
      {items.map((item, i) => (
        <div key={i} className="border border-gray-200 rounded-xl p-4 space-y-3 bg-white">
          <div className="flex justify-between">
            <span className="text-xs font-semibold text-gray-500">คำถามที่ {i + 1}</span>
            <button
              type="button"
              onClick={() => {
                setItems(items.filter((_, idx) => idx !== i));
                onDirtyChange(true);
              }}
              className="text-red-400 hover:text-red-600"
            >
              <Trash2 size={14} />
            </button>
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">คำถาม</label>
            <input
              value={item.q}
              onChange={(e) => update(i, 'q', e.target.value)}
              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">คำตอบ</label>
            <textarea
              value={item.a}
              onChange={(e) => update(i, 'a', e.target.value)}
              rows={2}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-primary/20 resize-none"
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────
export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState('profile');
  const [isDirty, setIsDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [pendingTab, setPendingTab] = useState<string | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const saveCallbackRef = useRef<(() => Promise<void>) | null>(null);

  const registerSave = useCallback((fn: (() => Promise<void>) | null) => {
    saveCallbackRef.current = fn;
  }, []);

  const handleDirtyChange = useCallback((dirty: boolean) => {
    setIsDirty(dirty);
    if (!dirty) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    }
  }, []);

  const handleTabClick = (tabId: string) => {
    if (tabId === activeTab) return;
    if (isDirty) {
      setPendingTab(tabId);
      setShowDialog(true);
    } else {
      setActiveTab(tabId);
    }
  };

  const handleSave = async () => {
    if (!saveCallbackRef.current) return;
    setSaving(true);
    await saveCallbackRef.current();
    setSaving(false);
  };

  const handleDialogSave = async () => {
    await handleSave();
    if (pendingTab) {
      setActiveTab(pendingTab);
      setIsDirty(false);
    }
    setPendingTab(null);
    setShowDialog(false);
  };

  const handleDialogDiscard = () => {
    if (pendingTab) {
      setActiveTab(pendingTab);
      setIsDirty(false);
    }
    setPendingTab(null);
    setShowDialog(false);
  };

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  const tabProps: TabBaseProps = { onDirtyChange: handleDirtyChange, registerSave };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">ตั้งค่าบัญชี & หน้าเว็บ</h1>
        <p className="text-sm text-gray-500 mt-1">
          จัดการเนื้อหาที่แสดงผลบน homepage และข้อมูลแอดมิน
        </p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 flex-wrap border-b border-gray-200">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => handleTabClick(tab.id)}
            className={`relative px-4 py-2 text-sm font-medium rounded-t-lg transition-colors border-b-2 -mb-px ${
              activeTab === tab.id
                ? 'border-primary text-primary bg-primary/5'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            {tab.label}
            {isDirty && activeTab === tab.id && (
              <span className="absolute top-1.5 right-1 w-1.5 h-1.5 rounded-full bg-amber-500" />
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div>
        {activeTab === 'profile' && <ProfileTab {...tabProps} />}
        {activeTab === 'students' && <StudentsTab {...tabProps} />}
        {activeTab === 'stats' && <StatsTab {...tabProps} />}
        {activeTab === 'universities' && <UniversitiesTab {...tabProps} />}
        {activeTab === 'tutors' && <TutorsTab {...tabProps} />}
        {activeTab === 'testimonial' && <TestimonialTab {...tabProps} />}
        {activeTab === 'faqs' && <FaqsTab {...tabProps} />}
      </div>

      <StickySaveBar isDirty={isDirty} saving={saving} saved={saved} onSave={handleSave} />

      {showDialog && (
        <UnsavedDialog
          onSave={handleDialogSave}
          onDiscard={handleDialogDiscard}
          onCancel={() => {
            setPendingTab(null);
            setShowDialog(false);
          }}
          saving={saving}
        />
      )}
    </div>
  );
}
