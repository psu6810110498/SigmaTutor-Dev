'use client';

import { X, ChevronDown, Users, Check } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

// ─── Types ────────────────────────────────────────────────────

export type InstructorRole = 'LEAD' | 'ASSISTANT' | 'GUEST';

export interface InstructorOption {
  id: string;
  name: string;
  nickname?: string | null;
  profileImage?: string | null;
}

export interface SelectedInstructor {
  id: string;
  role: InstructorRole;
  order: number;
}

// ─── ค่าคงที่ ─────────────────────────────────────────────────

const ROLE_LABELS: Record<InstructorRole, string> = {
  LEAD: 'ผู้สอนหลัก',
  ASSISTANT: 'ผู้ช่วยสอน',
  GUEST: 'รับเชิญ',
};

const ROLE_COLORS: Record<InstructorRole, string> = {
  LEAD: 'bg-primary/10 text-primary border-primary/20',
  ASSISTANT: 'bg-gray-100 text-gray-700 border-gray-200',
  GUEST: 'bg-purple-100 text-purple-700 border-purple-200',
};

// ─── Props ────────────────────────────────────────────────────

interface Props {
  /** รายชื่อผู้สอนทั้งหมดที่ดึงมาจาก API */
  options: InstructorOption[];
  /** ผู้สอนที่เลือกไว้แล้ว (id + role + order) */
  value: SelectedInstructor[];
  onChange: (updated: SelectedInstructor[]) => void;
  required?: boolean;
}

// ─── Component ───────────────────────────────────────────────

export function InstructorMultiSelect({ options, value, onChange, required }: Props) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // ปิด dropdown เมื่อคลิกนอกพื้นที่
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const selectedIds = new Set(value.map((v) => v.id));

  // แสดงตัวเลือกทั้งหมด (คนที่ยังไม่ถูกเลือก + คนที่เลือกแล้ว)
  const filtered = options;

  // เพิ่มผู้สอนใหม่ — คนแรกที่เพิ่มจะเป็น LEAD อัตโนมัติ
  const handleToggle = (opt: InstructorOption) => {
    if (selectedIds.has(opt.id)) {
      handleRemove(opt.id);
    } else {
      const isFirst = value.length === 0;
      onChange([
        ...value,
        { id: opt.id, role: isFirst ? 'LEAD' : 'ASSISTANT', order: value.length },
      ]);
    }
  };

  // ลบผู้สอนออก และ re-index order + ปรับ LEAD ถ้าจำเป็น
  const handleRemove = (id: string) => {
    const remaining = value
      .filter((v) => v.id !== id)
      .map((v, idx) => ({ ...v, order: idx }));

    // ถ้าไม่มี LEAD เหลือ ให้คนแรกเป็น LEAD
    const hasLead = remaining.some((v) => v.role === 'LEAD');
    if (!hasLead && remaining.length > 0) {
      remaining[0] = { ...remaining[0], role: 'LEAD' };
    }
    onChange(remaining);
  };

  // เปลี่ยน role ของผู้สอนคนนั้น (ป้องกัน LEAD ซ้ำ)
  const handleRoleChange = (id: string, role: InstructorRole) => {
    onChange(
      value.map((v) => {
        if (v.id === id) return { ...v, role };
        // ถ้าตั้งคนใหม่เป็น LEAD → ลด LEAD เดิมเป็น ASSISTANT
        if (role === 'LEAD' && v.role === 'LEAD') return { ...v, role: 'ASSISTANT' };
        return v;
      })
    );
  };

  // ดึงข้อมูลชื่อ/รูปของผู้สอนจาก options
  const getOption = (id: string) => options.find((o) => o.id === id);

  return (
    <div className="space-y-3">
      {/* ปุ่มเปิด Dropdown */}
      <div ref={dropdownRef} className="relative">
        <button 
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className={`w-full flex items-center justify-between min-h-[46px] bg-white border ${open ? 'border-primary ring-2 ring-primary/20 bg-primary/5' : 'border-gray-300 hover:border-gray-400'} rounded-xl transition-all px-4 py-2 text-left`}
        >
          <div className="flex items-center text-sm">
            <Users className="text-gray-400 shrink-0 mr-2" size={16} />
            <span className={value.length === 0 ? "text-gray-400" : "text-gray-800 font-medium"}>
              {value.length === 0 
                ? (required ? 'คลิกเพื่อเลือกผู้สอน *' : 'คลิกเพื่อเลือกผู้สอน...') 
                : `เลือกแล้ว ${value.length} ท่าน (+ เพิ่มอีก)`}
            </span>
          </div>
          <ChevronDown className={`text-gray-400 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} size={16} />
        </button>

        {/* Dropdown Options */}
        {open && (
           <div className="absolute z-50 top-full mt-2 left-0 right-0 bg-white border border-gray-100 rounded-xl shadow-xl overflow-hidden animate-fade-in-up">
            <div className="max-h-[250px] overflow-y-auto p-1.5">
              {filtered.length === 0 ? (
                <div className="px-4 py-6 text-center text-sm text-gray-500">
                  <span className="block text-3xl mb-2">✅</span>
                  เลือกผู้สอนทุกคนแล้ว
                </div>
              ) : (
                <div className="space-y-0.5">
                  {filtered.map((opt) => {
                    const isSelected = selectedIds.has(opt.id);
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggle(opt);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-all ${
                          isSelected 
                            ? 'bg-primary/10 text-primary font-medium' 
                            : 'hover:bg-gray-50 text-gray-700'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="relative w-8 h-8 rounded-full overflow-hidden shrink-0 bg-gray-100 border border-gray-200">
                            {opt.profileImage ? (
                              <img src={opt.profileImage} alt={opt.name} className="w-full h-full object-cover" loading="lazy" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs font-bold uppercase">
                                {opt.name?.charAt(0) || '?'}
                              </div>
                            )}
                          </div>
                          <div className="text-left flex flex-col">
                            <span>{opt.name}</span>
                            {opt.nickname && <span className="text-xs text-gray-500 font-normal">({opt.nickname})</span>}
                          </div>
                        </div>
                        {isSelected && <Check size={16} className="text-primary" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Selected Instructors List */}
      {value.length > 0 && (
        <div className="bg-gray-50/50 rounded-xl border border-gray-100 p-2 space-y-2">
          {value.map((sel) => {
            const opt = getOption(sel.id);
            if (!opt) return null;
            return (
              <div
                key={sel.id}
                className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 bg-white rounded-lg border border-gray-200 shadow-sm transition-all hover:shadow-md"
              >
                {/* Left side: Avatar + Name */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="relative w-10 h-10 rounded-full overflow-hidden shrink-0 shadow-sm border border-gray-100 bg-gray-50">
                    {opt.profileImage ? (
                      <img src={opt.profileImage} alt={opt.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm font-bold uppercase">
                        {opt.name?.charAt(0) || '?'}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">
                      {opt.name}
                    </p>
                    {opt.nickname && <p className="text-xs text-gray-500 truncate">({opt.nickname})</p>}
                  </div>
                </div>

                {/* Right side: Role Select + Remove Action */}
                <div className="flex items-center gap-2 pl-12 sm:pl-0">
                  <select
                    value={sel.role}
                    onChange={(e) => handleRoleChange(sel.id, e.target.value as InstructorRole)}
                    className={`text-xs px-3 py-1.5 rounded-lg border outline-none cursor-pointer font-semibold transition-colors focus:ring-2 focus:ring-primary/20 ${ROLE_COLORS[sel.role]}`}
                  >
                    {Object.entries(ROLE_LABELS).map(([r, label]) => (
                      <option key={r} value={r} className="bg-white text-gray-900 font-medium">
                        {label}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={() => handleRemove(sel.id)}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                    title="ลบผู้สอน"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
