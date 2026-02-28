"use client";

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { 
  FiUser, FiMail, FiPhone, FiCalendar, FiBookOpen, 
  FiMapPin, FiSave, FiLock, FiEdit3, FiMap, FiCamera 
} from 'react-icons/fi';

// ฟังก์ชันคุมความคมชัด: ตัดรูปเป็นสี่เหลี่ยมจัตุรัส 500x500px
const processProfileImage = (file: File): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const size = 500; 
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        const minSide = Math.min(img.width, img.height);
        const offsetX = (img.width - minSide) / 2;
        const offsetY = (img.height - minSide) / 2;
        ctx?.drawImage(img, offsetX, offsetY, minSide, minSide, 0, 0, size, size);
        resolve(canvas.toDataURL('image/jpeg', 0.9));
      };
    };
  });
};

export default function CompleteProfilePage() {
  const { user, checkAuth } = useAuth();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: '', msg: '' });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: '', phone: '', birthday: '', educationLevel: '',
    school: '', province: '', address: '', profileImage: ''
  });

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: user.name || '',
        phone: user.phone || '',
        birthday: user.birthday ? new Date(user.birthday).toISOString().split('T')[0] : '',
        educationLevel: user.educationLevel || '',
        school: user.school || '',
        province: user.province || '',
        address: user.address || '',
        profileImage: user.profileImage || ''
      }));
    }
  }, [user]);

  // --------------------------------------------------------
  // ✅ ฟังก์ชันคำนวณความสมบูรณ์ของข้อมูลแบบ Real-time
  // --------------------------------------------------------
  const completeness = useMemo(() => {
    const fieldsToCheck = [
      formData.name,
      user?.email, // นับอีเมลด้วยเพราะเป็นข้อมูลสำคัญ
      formData.phone,
      formData.birthday,
      formData.educationLevel,
      formData.school,
      formData.province,
      formData.address,
      formData.profileImage
    ];
    
    // นับจำนวนช่องที่มีการกรอกข้อมูลแล้ว (ไม่เป็นค่าว่าง)
    const filledCount = fieldsToCheck.filter(value => value && String(value).trim() !== '').length;
    // คำนวณเป็นเปอร์เซ็นต์
    return Math.round((filledCount / fieldsToCheck.length) * 100);
  }, [formData, user?.email]);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) return alert("จำกัดขนาด 5MB ครับ");
      const optimizedImage = await processProfileImage(file);
      setFormData(prev => ({ ...prev, profileImage: optimizedImage }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: '', msg: '' });

    try {
      const res = await fetch(`http://localhost:4000/api/users/${user?.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      
      if (res.ok && data.success) {
        setStatus({ type: 'success', msg: 'บันทึกข้อมูลเรียบร้อยแล้ว' });
        await checkAuth(); 
        setTimeout(() => setStatus({ type: '', msg: '' }), 3000);
      } else {
        setStatus({ type: 'error', msg: data.error || 'บันทึกไม่สำเร็จ โปรดลองอีกครั้ง' });
      }
    } catch (error) {
      setStatus({ type: 'error', msg: 'เกิดข้อผิดพลาดในการเชื่อมต่อ' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-6">
      
      {/* Header Section */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8 flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 w-full">
          {/* Profile Image Component */}
          <div className="relative group cursor-pointer flex-shrink-0" onClick={() => fileInputRef.current?.click()}>
            <input type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/*" className="hidden" />
            <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full overflow-hidden border border-gray-200 shadow-sm bg-gray-50 relative">
              <img 
                src={formData.profileImage || `https://ui-avatars.com/api/?name=${formData.name || 'User'}&background=f3f4f6&color=374151`} 
                className="w-full h-full object-cover transition-opacity group-hover:opacity-80" 
                alt="Profile" 
              />
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <FiCamera className="text-white w-6 h-6 sm:w-8 sm:h-8" />
              </div>
            </div>
            <div className="absolute bottom-0 right-0 sm:bottom-1 sm:right-1 bg-white p-1.5 sm:p-2 rounded-full border border-gray-200 shadow-sm text-gray-600 hover:text-primary transition-colors">
              <FiEdit3 className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>

          {/* User Info */}
          <div className="text-center sm:text-left flex-1 pt-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
              {formData.name || 'ผู้ใช้งาน'}
            </h1>
            <p className="text-sm text-gray-500 font-medium">จัดการข้อมูลส่วนตัวและการตั้งค่าบัญชีของคุณ</p>
          </div>
        </div>

        {/* ✅ Profile Status Indicator (Dynamic) */}
        <div className="hidden md:flex flex-col items-end pt-2">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">ความสมบูรณ์</span>
          <div className="flex items-center gap-2">
            <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-500 ease-out ${
                  completeness >= 100 ? 'bg-green-500' : completeness > 50 ? 'bg-blue-500' : 'bg-orange-400'
                }`}
                style={{ width: `${completeness}%` }}
              ></div>
            </div>
            <span className="text-sm font-bold text-gray-700">{completeness}%</span>
          </div>
        </div>
      </div>

      {/* Alert Messages */}
      {status.msg && (
        <div className={`p-4 rounded-xl text-sm font-medium border flex items-center gap-2 ${
          status.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'
        }`}>
          {status.type === 'success' ? <FiSave className="w-4 h-4" /> : <FiLock className="w-4 h-4" />}
          {status.msg}
        </div>
      )}

      {/* Form Sections */}
      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Section 1: Personal Info */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8">
          <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center border-b border-gray-100 pb-4">
            <FiUser className="mr-2 text-gray-400" /> ข้อมูลส่วนตัว
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputField label="ชื่อ-นามสกุล" icon={<FiUser />} value={formData.name} onChange={(v: string) => setFormData({...formData, name: v})} placeholder="ระบุชื่อ-นามสกุลจริง" />
            <InputField label="อีเมล" icon={<FiMail />} value={user?.email || ''} readOnly />
            <InputField label="เบอร์โทรศัพท์" icon={<FiPhone />} value={formData.phone} onChange={(v: string) => setFormData({...formData, phone: v})} placeholder="เช่น 0812345678" />
            <InputField label="วันเกิด" icon={<FiCalendar />} value={formData.birthday} onChange={(v: string) => setFormData({...formData, birthday: v})} type="date" />
          </div>
        </div>

        {/* Section 2: Education & Address */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8">
          <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center border-b border-gray-100 pb-4">
            <FiBookOpen className="mr-2 text-gray-400" /> การศึกษาและที่อยู่
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputField label="ระดับการศึกษา" icon={<FiBookOpen />} value={formData.educationLevel} onChange={(v: string) => setFormData({...formData, educationLevel: v})} placeholder="เช่น มัธยมปลาย, ปริญญาตรี" />
            <InputField label="สถานศึกษา" icon={<FiBookOpen />} value={formData.school} onChange={(v: string) => setFormData({...formData, school: v})} placeholder="ระบุชื่อโรงเรียนหรือมหาวิทยาลัย" />
            <InputField label="จังหวัด" icon={<FiMap />} value={formData.province} onChange={(v: string) => setFormData({...formData, province: v})} placeholder="เช่น สงขลา, กรุงเทพมหานคร" />
            <div className="md:col-span-2">
              <InputField label="ที่อยู่ปัจจุบัน" icon={<FiMapPin />} value={formData.address} onChange={(v: string) => setFormData({...formData, address: v})} placeholder="ระบุที่อยู่สำหรับจัดส่งเอกสาร" />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end pt-4 pb-8">
          <button 
            type="submit" 
            disabled={loading} 
            className="flex items-center justify-center px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors disabled:bg-blue-300 disabled:cursor-not-allowed shadow-sm min-w-[200px]"
          >
            {loading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                กำลังบันทึก...
              </span>
            ) : (
              <>
                <FiSave className="mr-2 w-5 h-5" /> บันทึกการเปลี่ยนแปลง
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

// ----------------------------------------------------------------------
// Reusable Input Field Component
// ----------------------------------------------------------------------
function InputField({ label, icon, value, onChange, type = "text", readOnly = false, placeholder = "" }: any) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
          {icon}
        </div>
        <input 
          type={type} 
          readOnly={readOnly} 
          value={value} 
          onChange={(e) => onChange && onChange(e.target.value)} 
          placeholder={placeholder}
          className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20
            ${readOnly 
              ? 'bg-gray-100 border-gray-200 text-gray-500 cursor-not-allowed' 
              : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500 hover:border-gray-400'
            }`}
        />
        {readOnly && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" title="ไม่สามารถแก้ไขได้">
            <FiLock className="w-4 h-4" />
          </div>
        )}
      </div>
    </div>
  );
}