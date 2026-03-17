"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, User, Briefcase, Camera } from "lucide-react";
import { useToast } from "@/app/components/ui/Toast";
import { useAuth } from "@/app/context/AuthContext";
import {
  TeacherRichFields,
  defaultTeacherFormData,
  type TeacherFormData,
} from "@/app/components/admin/teacher/TeacherRichFields";

export default function CreateTeacherPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [formData, setFormData] = useState<TeacherFormData>(defaultTeacherFormData);

  const handleChange = (field: keyof TeacherFormData, value: string) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  const handleRichChange = (updated: Partial<TeacherFormData>) =>
    setFormData((prev) => ({ ...prev, ...updated }));

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);

    setUploadingImage(true);
    try {
      const uploadData = new FormData();
      uploadData.append("file", file);
      const res = await fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api') + "/courses/upload/pdf", {
        method: "POST",
        credentials: "include",
        body: uploadData,
      });
      const data = await res.json();
      if (data.success) {
        setFormData((prev) => ({ ...prev, profileImage: data.url }));
        toast.success("อัปโหลดรูปภาพโปรไฟล์เรียบร้อย");
      }
    } catch {
      toast.error("อัปโหลดรูปภาพล้มเหลว");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        educationHistory: JSON.stringify(formData.educationHistory),
        achievements: JSON.stringify(formData.achievements),
      };
      const res = await fetch("http://localhost:4000/api/users/instructors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("เพิ่มคุณครูใหม่เรียบร้อยแล้ว");
        router.push("/admin/teachers");
      } else {
        toast.error(data.error || "เกิดข้อผิดพลาด");
      }
    } catch {
      toast.error("เซิร์ฟเวอร์ขัดข้อง โปรดลองอีกครั้ง");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <Link href="/admin/teachers" className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">เพิ่มคุณครูใหม่</h1>
            <p className="text-sm text-gray-500 mt-1">กรอกข้อมูลโปรไฟล์คุณครูให้ครบถ้วน</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/admin/teachers" className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all shadow-sm">
            ยกเลิก
          </Link>
          <button
            onClick={() => handleSubmit()}
            disabled={isSubmitting || uploadingImage}
            className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save size={16} />
            {uploadingImage ? "กำลังอัปโหลดรูป..." : isSubmitting ? "กำลังบันทึก..." : "บันทึกคุณครูใหม่"}
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
              <input type="file" accept="image/*" id="pfp" onChange={handleImageChange} className="hidden" disabled={uploadingImage} />
              <label htmlFor="pfp" className={`text-sm font-medium cursor-pointer ${uploadingImage ? "text-gray-400" : "text-blue-600 hover:text-blue-700"}`}>
                {uploadingImage ? "กำลังอัปโหลด..." : "อัปโหลดรูปภาพ"}
              </label>
            </div>
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">ชื่อ-นามสกุลจริง <span className="text-red-500">*</span></label>
                <input value={formData.name} onChange={(e) => handleChange("name", e.target.value)} required className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-sm shadow-sm" placeholder="กรอกชื่อ-นามสกุล" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">ชื่อเล่น</label>
                <input value={formData.nickname} onChange={(e) => handleChange("nickname", e.target.value)} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-sm shadow-sm" placeholder="กรอกชื่อเล่น" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">ตำแหน่งวิชาการ / สโลแกนประจำตัว</label>
                <input value={formData.title} onChange={(e) => handleChange("title", e.target.value)} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-sm shadow-sm" placeholder="เช่น ผู้เชี่ยวชาญด้านคณิตศาสตร์" />
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
