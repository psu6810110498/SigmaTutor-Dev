"use client";

import React from "react";
import {
  Plus, X, Link, BookOpen, Trophy, Quote,
  Facebook, Instagram, Youtube, Linkedin,
} from "lucide-react";

// TikTok doesn't have a Lucide icon — use a simple SVG inline
function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className ?? "w-4 h-4"}>
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.69a8.18 8.18 0 0 0 4.79 1.53V6.77a4.85 4.85 0 0 1-1.03-.08z" />
    </svg>
  );
}

export interface TeacherFormData {
  name: string;
  nickname: string;
  title: string;
  bio: string;
  profileImage: string;
  expertise: string;
  education: string;
  experience: string;
  socialLink: string;
  educationHistory: string[];
  achievements: string[];
  quote: string;
  facebookUrl: string;
  instagramUrl: string;
  tiktokUrl: string;
  linkedinUrl: string;
}

export const defaultTeacherFormData: TeacherFormData = {
  name: "", nickname: "", title: "", bio: "", profileImage: "",
  expertise: "", education: "", experience: "", socialLink: "",
  educationHistory: [], achievements: [], quote: "",
  facebookUrl: "", instagramUrl: "", tiktokUrl: "", linkedinUrl: "",
};

interface Props {
  formData: TeacherFormData;
  onChange: (updated: Partial<TeacherFormData>) => void;
}

// ── Reusable dynamic list editor ────────────────────────────────────────────

interface DynamicListProps {
  label: string;
  icon: React.ReactNode;
  placeholder: string;
  values: string[];
  addLabel: string;
  onAdd: () => void;
  onRemove: (index: number) => void;
  onChangeItem: (index: number, value: string) => void;
}

function DynamicList({
  label, icon, placeholder, values, addLabel,
  onAdd, onRemove, onChangeItem,
}: DynamicListProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1.5">
        {icon}
        {label}
      </label>
      <div className="space-y-2">
        {values.map((val, idx) => (
          <div key={idx} className="flex gap-2">
            <input
              type="text"
              value={val}
              placeholder={placeholder}
              onChange={(e) => onChangeItem(idx, e.target.value)}
              className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={() => onRemove(idx)}
              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              aria-label="ลบ"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={onAdd}
        className="mt-2 flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium"
      >
        <Plus className="w-4 h-4" />
        {addLabel}
      </button>
    </div>
  );
}

// ── Social link input ────────────────────────────────────────────────────────

interface SocialInputProps {
  icon: React.ReactNode;
  label: string;
  placeholder: string;
  value: string;
  onChange: (val: string) => void;
  colorClass: string;
}

function SocialInput({ icon, label, placeholder, value, onChange, colorClass }: SocialInputProps) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      <div className="flex items-center gap-2 border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500">
        <span className={`flex items-center justify-center w-9 h-9 flex-shrink-0 ${colorClass}`}>
          {icon}
        </span>
        <input
          type="url"
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 pr-3 py-2 text-sm bg-transparent focus:outline-none"
        />
      </div>
    </div>
  );
}

// ── Main exported component ──────────────────────────────────────────────────

/**
 * Shared rich-profile field sections for the admin teacher create/edit forms.
 * Keeps both pages DRY and the component tree flat.
 */
export function TeacherRichFields({ formData, onChange }: Props) {
  // Education history helpers
  const addEducation = () => onChange({ educationHistory: [...formData.educationHistory, ""] });
  const removeEducation = (i: number) =>
    onChange({ educationHistory: formData.educationHistory.filter((_, idx) => idx !== i) });
  const updateEducation = (i: number, val: string) => {
    const copy = [...formData.educationHistory];
    copy[i] = val;
    onChange({ educationHistory: copy });
  };

  // Achievement helpers
  const addAchievement = () => onChange({ achievements: [...formData.achievements, ""] });
  const removeAchievement = (i: number) =>
    onChange({ achievements: formData.achievements.filter((_, idx) => idx !== i) });
  const updateAchievement = (i: number, val: string) => {
    const copy = [...formData.achievements];
    copy[i] = val;
    onChange({ achievements: copy });
  };

  return (
    <>
      {/* ── Education History ──────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-blue-600" />
          ประวัติการศึกษา
        </h2>
        <DynamicList
          label="เพิ่มรายการการศึกษา"
          icon={null}
          placeholder="เช่น จุฬาลงกรณ์มหาวิทยาลัย — ปริญญาตรี วิศวกรรมศาสตร์ (2015–2019)"
          values={formData.educationHistory}
          addLabel="เพิ่มรายการการศึกษา"
          onAdd={addEducation}
          onRemove={removeEducation}
          onChangeItem={updateEducation}
        />
        {/* Legacy single-line education field (fallback) */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">
            การศึกษา (แบบย่อ — แสดงในการ์ดเดิม)
          </label>
          <input
            type="text"
            value={formData.education}
            placeholder="เช่น ป.ตรี วิศวกรรมศาสตร์ จุฬาฯ"
            onChange={(e) => onChange({ education: e.target.value })}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* ── Achievements ──────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
          <Trophy className="w-4 h-4 text-yellow-500" />
          ผลงาน / ความสำเร็จ
        </h2>
        <DynamicList
          label="เพิ่มรายการผลงาน"
          icon={null}
          placeholder="เช่น อดีตตัวแทนประเทศไทย โอลิมปิกคณิตศาสตร์ 2018"
          values={formData.achievements}
          addLabel="เพิ่มรายการผลงาน"
          onAdd={addAchievement}
          onRemove={removeAchievement}
          onChangeItem={updateAchievement}
        />
      </div>

      {/* ── Quote ─────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
          <Quote className="w-4 h-4 text-purple-600" />
          คำพูดของครูถึงนักเรียน
        </h2>
        <textarea
          value={formData.quote}
          placeholder='"ความสำเร็จเริ่มต้นจากการลงมือทำ ไม่ใช่แค่คิด"'
          onChange={(e) => onChange({ quote: e.target.value })}
          rows={3}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
      </div>

      {/* ── Social Links ──────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
          <Link className="w-4 h-4 text-gray-600" />
          โซเชียลมีเดีย
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <SocialInput
            icon={<TikTokIcon className="w-4 h-4 text-white" />}
            label="TikTok"
            placeholder="https://tiktok.com/@username"
            value={formData.tiktokUrl}
            onChange={(v) => onChange({ tiktokUrl: v })}
            colorClass="bg-black"
          />
          <SocialInput
            icon={<Instagram className="w-4 h-4 text-white" />}
            label="Instagram"
            placeholder="https://instagram.com/username"
            value={formData.instagramUrl}
            onChange={(v) => onChange({ instagramUrl: v })}
            colorClass="bg-gradient-to-br from-purple-500 to-pink-500"
          />
          <SocialInput
            icon={<Facebook className="w-4 h-4 text-white" />}
            label="Facebook"
            placeholder="https://facebook.com/pagename"
            value={formData.facebookUrl}
            onChange={(v) => onChange({ facebookUrl: v })}
            colorClass="bg-blue-600"
          />
          <SocialInput
            icon={<Linkedin className="w-4 h-4 text-white" />}
            label="LinkedIn"
            placeholder="https://linkedin.com/in/username"
            value={formData.linkedinUrl}
            onChange={(v) => onChange({ linkedinUrl: v })}
            colorClass="bg-blue-700"
          />
        </div>
        {/* Legacy single socialLink field */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">
            ลิงก์โซเชียลหลัก (legacy)
          </label>
          <div className="flex items-center gap-2 border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 px-3">
            <Link className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <input
              type="url"
              value={formData.socialLink}
              placeholder="https://..."
              onChange={(e) => onChange({ socialLink: e.target.value })}
              className="flex-1 py-2 text-sm bg-transparent focus:outline-none"
            />
          </div>
        </div>
      </div>
    </>
  );
}
