"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, User, Briefcase, Camera } from "lucide-react";
import { useToast } from "@/app/components/ui/Toast";
import {
  TeacherRichFields,
  defaultTeacherFormData,
  type TeacherFormData,
} from "@/app/components/admin/teacher/TeacherRichFields";

export default function EditTeacherPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [formData, setFormData] = useState<TeacherFormData>(defaultTeacherFormData);

  useEffect(() => {
    if (!params.id) return;

    const fetchTeacher = async () => {
      try {
        const res = await fetch(
            (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api") + `/users/instructors?t=${Date.now()}`,
            { method: "GET", credentials: "include", headers: { "Content-Type": "application/json" } }
        );
        const data = await res.json();
        if (data.success) {
          const teacher = data.data.find((t: any) => String(t.id) === String(params.id));
          if (!teacher) {
            toast.error("ไม่พบข้อมูลคุณครู");
            router.push("/admin/teachers");
            return;
          }

          setFormData({
            name: teacher.name ?? "",
            nickname: teacher.nickname ?? "",
            title: teacher.title ?? "",
            bio: teacher.bio ?? "",
            profileImage: teacher.profileImage ?? "",
            expertise: teacher.expertise ?? "",
            education: teacher.education ?? "",
            experience: teacher.experience ?? "",
            socialLink: teacher.socialLink ?? "",
            educationHistory: Array.isArray(teacher.educationHistory) ? teacher.educationHistory : [],
            achievements: Array.isArray(teacher.achievements) ? teacher.achievements : [],
            quote: teacher.quote ?? "",
            facebookUrl: teacher.facebookUrl ?? "",
            instagramUrl: teacher.instagramUrl ?? "",
            tiktokUrl: teacher.tiktokUrl ?? "",
            linkedinUrl: teacher.linkedinUrl ?? "",
          });

          setImagePreview(
            teacher.profileImage ||
              `https://api.dicebear.com/9.x/avataaars/svg?seed=${params.id}`
          );
        }
      } catch {
        toast.error("ดึงข้อมูลไม่สำเร็จ");
      } finally {
        setLoading(false);
      }
    };

    fetchTeacher();
  }, [params.id]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("ไฟล์รูปภาพต้องไม่เกิน 2MB");
      return;
    }
    setProfileImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleChange = (field: keyof TeacherFormData, value: string) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  const handleRichChange = (updated: Partial<TeacherFormData>) =>
    setFormData((prev) => ({ ...prev, ...updated }));
  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setSaving(true);
    try {
      const submitData = new FormData();
      if (profileImageFile) submitData.append("profileImage", profileImageFile);

      const payload = {
        ...formData,
        educationHistory: JSON.stringify(formData.educationHistory),
        achievements: JSON.stringify(formData.achievements),
      };
      Object.entries(payload).forEach(([key, value]) => {
        if (value !== undefined && value !== null) submitData.append(key, String(value));
      });

      const res = await fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api') + `/users/${params.id}`, {
        method: "PATCH",
        credentials: "include",
        body: submitData,
      });
      const data = await res.json();

      if (data.success) {
        toast.success("บันทึกข้อมูลสำเร็จ");
        router.push("/admin/teachers");
      } else {
        toast.error(data.error || "บันทึกไม่สำเร็จ");
      }
    } catch {
      toast.error("เชื่อมต่อเซิร์ฟเวอร์ล้มเหลว");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center space-y-4">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-medium text-gray-500">กำลังโหลดข้อมูล...</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <Link href="/admin/teachers" className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">แก้ไขโปรไฟล์คุณครู</h1>
            <p className="text-sm text-gray-500 mt-1">อัปเดตข้อมูลส่วนตัว ประวัติการศึกษา และโซเชียล</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/admin/teachers" className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all shadow-sm">
            ยกเลิก
          </Link>
          <button
            onClick={() => handleSubmit()}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save size={16} />
            {saving ? "กำลังบันทึก..." : "บันทึกการเปลี่ยนแปลง"}
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Basic Info */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 flex items-center gap-2 bg-gray-50/50">
            <User size={18} className="text-gray-500" />
            <h2 className="text-base font-semibold text-gray-800">ข้อมูลพื้นฐาน</h2>
          </div>
          <div className="p-6 md:p-8 flex flex-col md:flex-row gap-8">
            {/* Profile photo */}
            <div className="flex flex-col items-center space-y-4">
              <div className="relative group w-32 h-32 rounded-full border border-gray-200 shadow-sm overflow-hidden bg-gray-50 flex items-center justify-center">
                {imagePreview ? (
                  <img src={imagePreview} className="w-full h-full object-cover" alt="Profile" />
                ) : (
                  <User size={40} className="text-gray-300" />
                )}
                <label htmlFor="pfp" className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                  <Camera size={24} className="text-white" />
                </label>
              </div>
              <input type="file" accept="image/*" id="pfp" onChange={handleImageChange} className="hidden" />
              <label htmlFor="pfp" className="text-sm font-medium text-blue-600 hover:text-blue-700 cursor-pointer">
                เปลี่ยนรูปภาพ
              </label>
            </div>

            {/* Fields */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">ชื่อ-นามสกุลจริง <span className="text-red-500">*</span></label>
                <input value={formData.name} onChange={(e) => handleChange("name", e.target.value)} required className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-sm shadow-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">ชื่อเล่น</label>
                <input value={formData.nickname} onChange={(e) => handleChange("nickname", e.target.value)} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-sm shadow-sm" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">ตำแหน่งวิชาการ / สโลแกนประจำตัว</label>
                <input value={formData.title} onChange={(e) => handleChange("title", e.target.value)} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-sm shadow-sm" />
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Professional Info */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 flex items-center gap-2 bg-gray-50/50">
            <Briefcase size={18} className="text-gray-500" />
            <h2 className="text-base font-semibold text-gray-800">ประวัติและความเชี่ยวชาญ</h2>
          </div>
          <div className="p-6 md:p-8 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Bio / ประวัติย่อ</label>
              <textarea value={formData.bio} onChange={(e) => handleChange("bio", e.target.value)} rows={4} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-sm shadow-sm resize-y" placeholder="เขียนประวัติย่อหรือคำแนะนำตัวที่น่าสนใจ..." />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">ความเชี่ยวชาญ</label>
                <input value={formData.expertise} onChange={(e) => handleChange("expertise", e.target.value)} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-sm shadow-sm" placeholder="เช่น คณิตศาสตร์, ฟิสิกส์, IELTS" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">ประสบการณ์การสอน</label>
                <input value={formData.experience} onChange={(e) => handleChange("experience", e.target.value)} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-sm shadow-sm" placeholder="เช่น 5 ปีในโรงเรียนกวดวิชา" />
              </div>
            </div>
          </div>
        </div>

        {/* Section 3-6: Rich Profile (shared component) */}
        <TeacherRichFields formData={formData} onChange={handleRichChange} />
      </form>
    </div>
  );
}
