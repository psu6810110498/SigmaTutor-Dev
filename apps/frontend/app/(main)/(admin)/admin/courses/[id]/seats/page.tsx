'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, RefreshCw, Users, Mail, AlertTriangle } from 'lucide-react';
import { useCourseAvailability } from '@/app/hooks/useCourseAvailability';
import { useToast } from '@/app/components/ui/Toast';
import { ConfirmDialog } from '@/app/components/ui/ConfirmDialog';
import { courseApi } from '@/app/lib/api';

// Since api is used directly for custom endpoints like /enrollments, /seats/sync, 
// I need to use fetch directly or add them to courseApi. 
// For now, I'll define a local request helper or use fetch.
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

async function fetchApi<T>(endpoint: string, options: RequestInit = {}) {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include',
  });
  
  let json;
  try { json = await res.json(); } catch { json = {}; }
  
  if (!res.ok) {
    return { success: false, error: json.error || `HTTP ${res.status}`, data: null as T };
  }
  return json as { success: boolean; data?: T; error?: string };
}

interface EnrollmentUser {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  profileImage: string | null;
}

interface Enrollment {
  id: string;
  userId: string;
  courseId: string;
  status: string;
  createdAt: string;
  user: EnrollmentUser;
}

export default function AdminSeatManagementPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const courseId = params.id as string;

  const [course, setCourse] = useState<any>(null);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  
  // State for editing max seats
  const [isEditingMax, setIsEditingMax] = useState(false);
  const [newMaxSeats, setNewMaxSeats] = useState<number>(0);
  
  // Real-time seat data from hook
  const { availability, isLoading: isAvailabilityLoading, mutate } = useCourseAvailability(courseId);

  useEffect(() => {
    fetchCourseAndEnrollments();
  }, [courseId]);

  const fetchCourseAndEnrollments = async () => {
    setLoading(true);
    try {
      // 1. Fetch basic course info
      const courseRes = await fetchApi<any>(`/courses/${courseId}`);
      if (courseRes.success && courseRes.data) {
        setCourse(courseRes.data);
        setNewMaxSeats(courseRes.data.maxSeats || 0);
      }

      // 2. Fetch enrollments
      const enrollRes = await fetchApi<Enrollment[]>(`/courses/${courseId}/enrollments`);
      if (enrollRes.success && enrollRes.data) {
        setEnrollments(enrollRes.data);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
      toast.error('ไม่สามารถโหลดข้อมูลคอร์สได้');
    } finally {
      setLoading(false);
    }
  };

  const handleSyncCounter = async () => {
    try {
      const res = await fetchApi<any>(`/courses/${courseId}/seats/sync`, { method: 'POST' });
      if (res.success) {
        toast.success('อัพเดตตัวเลขจำนวนที่นั่งเรียบร้อยแล้ว');
        mutate(); // refresh hook data
      } else {
        toast.error(res.error || 'เกิดข้อผิดพลาดในการอัพเดตข้อมูล');
      }
    } catch (error) {
      console.error(error);
      toast.error('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้');
    }
  };

  const handleSaveMaxSeats = async () => {
    if (newMaxSeats < enrollments.length) {
      toast.error(`จำนวนที่นั่งสูงสุดน้อยกว่าจำนวนผู้สมัคร (${enrollments.length} คน)`);
      return;
    }
    
    try {
      const res = await fetchApi<any>(`/courses/${courseId}/seats`, { 
        method: 'PATCH',
        body: JSON.stringify({ maxSeats: newMaxSeats }) 
      });
      if (res.success) {
        toast.success('บันทึกจำนวนที่นั่งใหม่เรียบร้อยแล้ว');
        setIsEditingMax(false);
        setCourse({ ...course, maxSeats: newMaxSeats });
        mutate(); // refresh hook data
      } else {
        toast.error(res.error || 'บันทึกไม่สำเร็จ');
      }
    } catch (error) {
      console.error(error);
      toast.error('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้');
    }
  };

  const handleExportCSV = () => {
    const headers = ['ชื่อ-นามสกุล', 'อีเมล', 'เบอร์โทรศัพท์', 'วันที่สมัคร', 'สถานะ'];
    const rows = enrollments.map(e => [
      e.user.name,
      e.user.email,
      e.user.phone || '-',
      new Date(e.createdAt).toLocaleString('th-TH'),
      e.status
    ]);
    
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `enrollments_${course?.slug || courseId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) return <div className="p-8 text-center text-gray-500 animate-pulse">กำลังโหลดข้อมูล...</div>;
  if (!course) return <div className="p-8 text-center text-red-500">ไม่พบคอร์สเรียน</div>;

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => router.back()} 
            className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 border-b-0">จัดการที่นั่ง (Seat Management)</h1>
            <p className="text-gray-500 text-sm mt-1">{course.title}</p>
          </div>
        </div>
        <span className="px-3 py-1 bg-orange-100 text-orange-700 font-semibold text-xs rounded-full border border-orange-200">
          {course.courseType === 'ONSITE' ? '🏫 Onsite' : '🎥 Live'}
        </span>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Real-time Status Card */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                {availability?.percentage === 100 ? (
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                ) : (
                  <>
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                  </>
                )}
              </span>
              สถานะที่นั่ง Real-time
            </h2>
            <button 
              onClick={handleSyncCounter}
              className="text-xs flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-600 font-medium rounded-lg transition-colors"
            >
              <RefreshCw size={12} /> Sync ใหม่
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2 font-medium">
                <span className="text-gray-600">ที่นั่งใช้ไปแล้ว</span>
                <span className={availability?.isFull ? 'text-red-600 font-bold' : 'text-gray-900'}>
                  {availability ? (availability.maxSeats - availability.remaining) : enrollments.length} 
                  <span className="text-gray-400 font-normal mx-1">/</span> 
                  {course.maxSeats}
                </span>
              </div>
              <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-500 ${availability?.isFull ? 'bg-red-500' : 'bg-primary'}`}
                  style={{ width: `${availability?.percentage || 0}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-4 border-t border-gray-100">
              <div className="bg-green-50 rounded-lg p-3 border border-green-100 text-center">
                <p className="text-xs text-green-600 font-medium mb-1">สมัครแล้ว</p>
                <p className="text-xl font-bold text-green-700">{availability?.enrolledCount ?? enrollments.length}</p>
              </div>
              <div className="bg-orange-50 rounded-lg p-3 border border-orange-100 text-center">
                <p className="text-xs text-orange-600 font-medium mb-1">กำลังจอง</p>
                <p className="text-xl font-bold text-orange-700">{availability?.reservedCount ?? 0}</p>
              </div>
              <div className="bg-blue-50 rounded-lg p-3 border border-blue-100 text-center">
                <p className="text-xs text-blue-600 font-medium mb-1">ว่าง</p>
                <p className="text-xl font-bold text-blue-700">{availability?.remaining ?? (course.maxSeats - enrollments.length)}</p>
              </div>
            </div>
            
            {availability?.isFull && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm flex items-start gap-2 border border-red-100 mt-2">
                <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                <span>คอร์สนี้เต็มแล้ว ไม่สามารถรับสมัครเพิ่มได้ (สามารถเพิ่ม Max Seats ได้หากต้องการ)</span>
              </div>
            )}
          </div>
        </div>

        {/* Configuration Card */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 mb-6 border-b-0 pb-0">ตั้งค่าที่นั่ง</h2>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                จำนวนที่นั่งสูงสุด (Max Seats)
              </label>
              
              {!isEditingMax ? (
                <div className="flex items-center gap-4">
                  <div className="text-3xl font-bold text-gray-900 bg-gray-50 px-6 py-3 rounded-xl border border-gray-200">
                    {course.maxSeats}
                  </div>
                  <button 
                    onClick={() => setIsEditingMax(true)}
                    className="text-sm font-semibold text-primary hover:text-primary/80 transition-colors bg-primary/5 px-4 py-2 rounded-lg"
                  >
                    ปรับจำนวน
                  </button>
                </div>
              ) : (
                <div className="flex gap-2 items-center">
                  <input 
                    type="number" 
                    min={enrollments.length}
                    value={newMaxSeats} 
                    onChange={(e) => setNewMaxSeats(parseInt(e.target.value) || 0)}
                    className="border-2 border-primary focus:outline-none rounded-xl px-4 py-2 w-32 font-bold text-lg text-center shadow-sm"
                  />
                  <div className="flex flex-col gap-1">
                    <button 
                      onClick={handleSaveMaxSeats}
                      className="bg-primary hover:bg-primary/90 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                    >บันทึก</button>
                    <button 
                      onClick={() => { setIsEditingMax(false); setNewMaxSeats(course.maxSeats); }}
                      className="bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                    >ยกเลิก</button>
                  </div>
                </div>
              )}
              <p className="text-xs text-gray-500 mt-2 flex items-center gap-1.5">
                <AlertTriangle size={12} />
                จำนวนที่นั่งสูงสุดต้องไม่น้อยกว่าจำนวนผู้สมัครแล้ว ({enrollments.length})
              </p>
            </div>
            
            <div className="pt-6 border-t border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">การแจ้งเตือนยอดสมัคร</h3>
              <p className="text-xs text-gray-500 mb-4">ระบบจะส่งการแจ้งเตือนไปยังแอดมินเมื่อที่นั่งใกล้เต็ม (เหลือ 10%) และเมื่อเต็มแล้ว (Coming soon)</p>
              <div className="flex items-center opacity-50 cursor-not-allowed">
                <input type="checkbox" className="mr-2 rounded text-primary focus:ring-primary h-4 w-4 border-gray-300" disabled checked />
                <span className="text-sm text-gray-600 font-medium">ส่งแจ้งเตือนอัตโนมัติ </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* User List Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Users className="text-gray-400" size={20} />
            <h2 className="text-lg font-bold text-gray-900">รายชื่อผู้สมัคร ({enrollments.length})</h2>
          </div>
          <button 
            onClick={handleExportCSV}
            disabled={enrollments.length === 0}
            className="text-sm bg-gray-900 hover:bg-gray-800 text-white font-medium py-2 px-4 rounded-lg transition-colors shadow-sm disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            ดาวน์โหลด CSV
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-200">
                <th className="px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">#</th>
                <th className="px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">ชื่อนักเรียน</th>
                <th className="px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">ข้อมูลติดต่อ</th>
                <th className="px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">วันที่สมัคร</th>
                <th className="px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">สถานะ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {enrollments.length > 0 ? (
                enrollments.map((enrollment, index) => (
                  <tr key={enrollment.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-500">{index + 1}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {enrollment.user.profileImage ? (
                          <img src={enrollment.user.profileImage} alt="" className="w-8 h-8 rounded-full border border-gray-200" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">
                            {enrollment.user.name.charAt(0)}
                          </div>
                        )}
                        <span className="font-medium text-gray-900">{enrollment.user.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1 text-sm text-gray-600">
                        <div className="flex items-center gap-1.5"><Mail size={12} className="text-gray-400" /> {enrollment.user.email}</div>
                        {enrollment.user.phone && <div className="flex items-center gap-1.5 text-xs text-gray-500">{enrollment.user.phone}</div>}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(enrollment.createdAt).toLocaleDateString('th-TH', { 
                        year: 'numeric', month: 'short', day: 'numeric',
                        hour: '2-digit', minute: '2-digit'
                      })}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="px-2.5 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full border border-green-200">
                        {enrollment.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center gap-2">
                      <Users size={32} className="text-gray-300" />
                      <p>ยังไม่มีผู้สมัครในคอร์สนี้</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
