"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { 
  FiUser, FiMail, FiPhone, FiCalendar, FiBookOpen, 
  FiMapPin, FiSave, FiLock, FiEdit3, FiMap, FiCamera 
} from 'react-icons/fi';

// ✅ ฟังก์ชันคุมความคมชัด: ตัดรูปเป็นสี่เหลี่ยมจัตุรัส 500x500px
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
        credentials: 'include', // ✅ หัวใจสำคัญ! ต้องส่งอันนี้ไปเพื่อยืนยันตัวตนว่าเราคือเจ้าของบัญชีตัวจริง
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      
      if (res.ok && data.success) {
        setStatus({ type: 'success', msg: 'บันทึกข้อมูลและรูปโปรไฟล์สำเร็จ ✨' });
        await checkAuth(); // ✅ อัปเดตข้อมูลทุกจุดในแอปทันที
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
    <div className="max-w-5xl mx-auto py-10 px-4 space-y-8 animate-in fade-in duration-700">
      <input type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/*" className="hidden" />
      
      {/* --- ส่วนหัวพรีเมียม --- */}
      <div className="flex flex-col md:flex-row justify-between items-center bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-xl">
        <div className="flex items-center gap-8">
          <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
            <div className="w-28 h-28 rounded-[2rem] overflow-hidden border-4 border-primary/10 shadow-lg group-hover:scale-105 transition-all">
              <img src={formData.profileImage || `https://ui-avatars.com/api/?name=${formData.name}&background=random`} className="w-full h-full object-cover" alt="Profile" />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                <FiCamera className="text-white w-10 h-10" />
              </div>
            </div>
            <div className="absolute -bottom-2 -right-2 bg-primary text-white p-2.5 rounded-2xl shadow-lg border-2 border-white group-hover:rotate-12 transition-transform">
              <FiEdit3 className="w-5 h-5" />
            </div>
          </div>
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">คุณ{formData.name || 'ผู้ใช้งาน'}</h1>
            <p className="text-gray-400 font-bold text-xs uppercase tracking-[0.2em] mt-1">Learner Profile Account</p>
          </div>
        </div>
        
        <div className="hidden lg:flex items-center gap-4 bg-primary/5 p-5 rounded-[2rem] border border-primary/10">
           <div className="w-14 h-14 rounded-full border-[4px] border-orange-400 border-t-transparent flex items-center justify-center text-xs font-black text-orange-500">85%</div>
           <div>
             <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">สถานะโปรไฟล์</p>
             <p className="text-sm font-black text-primary">เกือบสมบูรณ์แล้ว</p>
           </div>
        </div>
      </div>

      {status.msg && (
        <div className={`p-4 rounded-2xl text-center font-bold border-2 transition-all ${status.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
          {status.msg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* ข้อมูลส่วนตัว */}
        <div className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-gray-100 border border-gray-50">
          <h2 className="flex items-center text-xl font-black text-gray-800 mb-8">
            <span className="w-2.5 h-8 bg-primary rounded-full mr-4 shadow-lg shadow-primary/20"></span> ข้อมูลส่วนตัว
          </h2>
          <div className="space-y-6">
            <InputField label="ชื่อ-นามสกุล" icon={<FiUser />} value={formData.name} onChange={(v: string) => setFormData({...formData, name: v})} />
            <InputField label="อีเมล" icon={<FiMail />} value={user?.email || ''} readOnly />
            <InputField label="เบอร์โทรศัพท์" icon={<FiPhone />} value={formData.phone} onChange={(v: string) => setFormData({...formData, phone: v})} placeholder="เช่น 08x-xxx-xxxx" />
            <InputField label="วันเกิด" icon={<FiCalendar />} value={formData.birthday} onChange={(v: string) => setFormData({...formData, birthday: v})} type="date" />
          </div>
        </div>

        {/* การศึกษาและที่อยู่ */}
        <div className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-gray-100 border border-gray-50">
          <h2 className="flex items-center text-xl font-black text-orange-500 mb-8">
            <span className="w-2.5 h-8 bg-orange-400 rounded-full mr-4 shadow-lg shadow-orange-400/20"></span> การศึกษาและที่อยู่
          </h2>
          <div className="space-y-6">
            <InputField label="ระดับการศึกษา" icon={<FiBookOpen />} value={formData.educationLevel} onChange={(v: string) => setFormData({...formData, educationLevel: v})} placeholder="เช่น มัธยมปลาย" />
            <InputField label="โรงเรียน / มหาวิทยาลัย" icon={<FiBookOpen />} value={formData.school} onChange={(v: string) => setFormData({...formData, school: v})} placeholder="ระบุชื่อสถาบัน" />
            <InputField label="จังหวัด" icon={<FiMap />} value={formData.province} onChange={(v: string) => setFormData({...formData, province: v})} placeholder="เช่น สงขลา" />
            <InputField label="ที่อยู่ปัจจุบัน" icon={<FiMapPin />} value={formData.address} onChange={(v: string) => setFormData({...formData, address: v})} placeholder="ระบุที่อยู่" />
          </div>
        </div>

        <div className="lg:col-span-2 flex justify-end pt-4">
          <button type="submit" disabled={loading} className="group flex items-center px-20 py-5 bg-primary text-white font-black rounded-3xl shadow-2xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all disabled:opacity-50">
            {loading ? 'กำลังบันทึกข้อมูล...' : <><FiSave className="mr-4 w-6 h-6" /> บันทึกข้อมูลทั้งหมด</>}
          </button>
        </div>
      </form>
    </div>
  );
}

function InputField({ label, icon, value, onChange, type = "text", readOnly = false, placeholder = "" }: any) {
  return (
    <div className="group">
      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2.5 ml-1">{label}</label>
      <div className="relative">
        <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors">{icon}</div>
        <input 
          type={type} readOnly={readOnly} value={value} onChange={(e) => onChange && onChange(e.target.value)} placeholder={placeholder}
          className={`w-full pl-14 pr-5 py-4.5 rounded-2xl border-2 transition-all outline-none font-bold text-gray-700 
            ${readOnly ? 'bg-gray-50 border-transparent text-gray-300 cursor-not-allowed' : 'bg-gray-50 border-gray-50 focus:border-primary focus:bg-white focus:shadow-sm'}`}
        />
        {readOnly && <FiLock className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-200" />}
      </div>
    </div>
  );
}