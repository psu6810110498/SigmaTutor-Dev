'use client';

import Image from 'next/image';
import { X, ChevronDown, Users } from 'lucide-react';
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
  GUEST: 'ผู้สอนรับเชิญ',
};

const ROLE_COLORS: Record<InstructorRole, string> = {
  LEAD: 'bg-blue-100 text-blue-700',
  ASSISTANT: 'bg-gray-100 text-gray-600',
  GUEST: 'bg-purple-100 text-purple-700',
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
  const [search, setSearch] = useState('');
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

  const filtered = options.filter((opt) => {
    if (selectedIds.has(opt.id)) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      opt.name?.toLowerCase().includes(q) ||
      opt.nickname?.toLowerCase().includes(q)
    );
  });

  // เพิ่มผู้สอนใหม่ — คนแรกที่เพิ่มจะเป็น LEAD อัตโนมัติ
  const handleAdd = (opt: InstructorOption) => {
    const isFirst = value.length === 0;
    onChange([
      ...value,
      { id: opt.id, role: isFirst ? 'LEAD' : 'ASSISTANT', order: value.length },
    ]);
    setSearch('');
    setOpen(false);
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
    <div className="space-y-2">
      {/* รายชื่อที่เลือกแล้ว */}
      {value.length > 0 && (
        <div className="space-y-2">
          {value.map((sel) => {
            const opt = getOption(sel.id);
            if (!opt) return null;
            return (
              <div
                key={sel.id}
                className="flex items-center gap-3 p-2.5 rounded-lg border border-gray-200 bg-gray-50"
              >
                {/* Avatar */}
                <div className="relative w-8 h-8 rounded-full overflow-hidden flex-shrink-0 bg-primary">
                  {opt.profileImage ? (
                    <Image src={opt.profileImage} alt={opt.name} fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white text-xs font-bold">
                      {opt.name?.charAt(0)}
                    </div>
                  )}
                </div>

                {/* ชื่อ */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">
                    {opt.name}
                    {opt.nickname && (
                      <span className="text-gray-400 font-normal ml-1">({opt.nickname})</span>
                    )}
                  </p>
                </div>

                {/* เลือก role */}
                <select
                  value={sel.role}
                  onChange={(e) => handleRoleChange(sel.id, e.target.value as InstructorRole)}
                  className={`text-xs px-2 py-1 rounded-full border-0 font-medium cursor-pointer ${ROLE_COLORS[sel.role]}`}
                >
                  {Object.entries(ROLE_LABELS).map(([r, label]) => (
                    <option key={r} value={r}>{label}</option>
                  ))}
                </select>

                {/* ปุ่มลบ */}
                <button
                  type="button"
                  onClick={() => handleRemove(sel.id)}
                  className="text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
                  title="ลบผู้สอนนี้ออก"
                >
                  <X size={14} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Dropdown เพิ่มผู้สอน */}
      <div ref={dropdownRef} className="relative">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="w-full flex items-center gap-2 px-3 py-2 border border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-primary hover:text-primary transition-colors"
        >
          <Users size={14} />
          <span>
            {value.length === 0
              ? required
                ? 'เลือกผู้สอน *'
                : 'เลือกผู้สอน'
              : '+ เพิ่มผู้สอน'}
          </span>
          <ChevronDown size={14} className={`ml-auto transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>

        {open && (
          <div className="absolute z-50 top-full mt-1 left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
            {/* ช่องค้นหา */}
            <div className="p-2 border-b border-gray-100">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ค้นหาชื่อ..."
                className="w-full text-sm px-2 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:border-primary"
                autoFocus
              />
            </div>

            {/* รายการผู้สอน */}
            <ul className="max-h-48 overflow-y-auto">
              {filtered.length === 0 ? (
                <li className="px-3 py-3 text-xs text-gray-400 text-center">
                  {search ? 'ไม่พบผู้สอนที่ค้นหา' : 'ผู้สอนทุกคนถูกเลือกแล้ว'}
                </li>
              ) : (
                filtered.map((opt) => (
                  <li key={opt.id}>
                    <button
                      type="button"
                      onClick={() => handleAdd(opt)}
                      className="w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-gray-50 transition-colors"
                    >
                      <div className="relative w-7 h-7 rounded-full overflow-hidden flex-shrink-0 bg-primary">
                        {opt.profileImage ? (
                          <Image src={opt.profileImage} alt={opt.name} fill className="object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-white text-[10px] font-bold">
                            {opt.name?.charAt(0)}
                          </div>
                        )}
                      </div>
                      <span className="text-gray-700">
                        {opt.name}
                        {opt.nickname && (
                          <span className="text-gray-400 ml-1">({opt.nickname})</span>
                        )}
                      </span>
                    </button>
                  </li>
                ))
              )}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
