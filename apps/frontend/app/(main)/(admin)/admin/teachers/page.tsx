'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users,
  Search,
  Filter,
  Mail,
  Phone,
  Trash2,
  Edit,
  Plus,
  UserCheck,
  BookOpen,
  X,
  ChevronDown,
} from 'lucide-react';
import { AdminTableLayout } from '@/app/components/layouts/AdminTableLayout';
import { Button } from '@/app/components/ui/Button';
import { useToast } from '@/app/components/ui/Toast';

export default function AdminTeachersPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [coursePopup, setCoursePopup] = useState<{ teacher: any } | null>(null);
  const [expandedCourse, setExpandedCourse] = useState<string | null>(null);

  const fetchTeachers = async () => {
    try {
      setLoading(true);
      const res = await fetch('http://localhost:4000/api/users/instructors', {
        credentials: 'include',
      });
      const data = await res.json();
      if (data.success) {
        setTeachers(data.data);
      } else {
        toast.error('ไม่สามารถโหลดข้อมูลผู้สอนได้');
      }
    } catch (error) {
      console.error('Failed to fetch teachers:', error);
      toast.error('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeachers();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('คุณต้องการลบผู้สอนท่านนี้ใช่หรือไม่?')) return;
    try {
      const res = await fetch(`http://localhost:4000/api/users/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await res.json();
      if (data.success) {
        toast.success('ลบข้อมูลผู้สอนสำเร็จ');
        fetchTeachers();
      } else {
        toast.error(data.error || 'ไม่สามารถลบข้อมูลได้');
      }
    } catch (error) {
      toast.error('เกิดข้อผิดพลาดในการลบข้อมูล');
    }
  };

  const filteredTeachers = teachers.filter(
    (t) =>
      t.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.nickname?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AdminTableLayout
      title="จัดการผู้สอน"
      description="จัดการข้อมูลอาจารย์ ผู้ช่วยสอน และนักเขียนบทความ"
      icon={UserCheck}
      stats={[
        {
          label: 'ผู้สอนทั้งหมด',
          value: teachers.length.toString(),
          icon: UserCheck,
          color: 'blue',
        },
        {
          label: 'คอร์สทั้งหมด',
          value: teachers
            .reduce((sum: number, t: any) => sum + (t._count?.courses || 0), 0)
            .toString(),
          icon: BookOpen,
          color: 'purple',
        },
        {
          label: 'นักเรียนทั้งหมด',
          value: teachers
            .reduce((sum: number, t: any) => sum + (t._count?.enrollments || 0), 0)
            .toString(),
          icon: Users,
          color: 'green',
        },
      ]}
      actions={
        <Button variant="primary" onClick={() => router.push('/admin/teachers/create')}>
          <Plus size={18} className="mr-2" /> เพิ่มผู้สอนใหม่
        </Button>
      }
    >
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {/* Search & Filter Bar */}
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row gap-4 items-center justify-between bg-slate-50/50">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="ค้นหาชื่อ, อีเมล หรือชื่อเล่น..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Filter size={16} className="mr-2" /> ตัวกรอง
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-widest border-b border-slate-100">
                <th className="px-6 py-4">ผู้สอน</th>
                <th className="px-6 py-4">ข้อมูลติดต่อ</th>
                <th className="px-6 py-4">คอร์สที่สอน</th>
                <th className="px-6 py-4">นักเรียน</th>
                <th className="px-6 py-4">สถานะ</th>
                <th className="px-6 py-4 text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-12 text-center text-slate-400 text-sm animate-pulse"
                  >
                    กำลังโหลดข้อมูล...
                  </td>
                </tr>
              ) : filteredTeachers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400 text-sm">
                    ไม่พบข้อมูลผู้สอน
                  </td>
                </tr>
              ) : (
                filteredTeachers.map((teacher) => (
                  <tr key={teacher.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-100 overflow-hidden ring-2 ring-white shadow-sm shrink-0">
                          <img
                            src={
                              teacher.profileImage ||
                              `https://api.dicebear.com/9.x/avataaars/svg?seed=${teacher.id}`
                            }
                            alt={teacher.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900 leading-none">
                            {teacher.name}
                          </p>
                          <p className="text-xs text-blue-600 font-medium mt-1">
                            {teacher.nickname ? `@${teacher.nickname}` : 'ไม่ระบุชื่อเล่น'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <Mail size={12} className="text-slate-300" />
                          {teacher.email}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <Phone size={12} className="text-slate-300" />
                          {teacher.phone || '-'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => setCoursePopup({ teacher })}
                        className="text-left hover:opacity-80 transition-opacity cursor-pointer"
                      >
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-black rounded-full border border-blue-100">
                          {teacher._count?.courses || 0} คอร์ส
                        </span>
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="w-8 h-8 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center text-xs font-black border border-emerald-100">
                        {teacher._count?.enrollments || 0}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-green-50 text-green-600 border border-green-100">
                        พร้อมสอน
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 !p-0 text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                          onClick={() => router.push(`/admin/teachers/${teacher.id}/edit`)}
                        >
                          <Edit size={14} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 !p-0 text-slate-400 hover:text-red-600 hover:bg-red-50"
                          onClick={() => handleDelete(teacher.id)}
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Course List — Right Side Drawer */}
      {coursePopup && (
        <div
          className="fixed inset-0 bg-black/30 z-50"
          onClick={() => {
            setCoursePopup(null);
            setExpandedCourse(null);
          }}
        >
          <div
            className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl flex flex-col animate-in slide-in-from-right"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex items-start justify-between shrink-0">
              <div>
                <h3 className="font-bold text-slate-900 text-lg">คอร์สที่สอน</h3>
                <p className="text-sm text-slate-500 mt-1">ของ {coursePopup.teacher.name}</p>
              </div>
              <button
                onClick={() => {
                  setCoursePopup(null);
                  setExpandedCourse(null);
                }}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Course List with Expandable Students */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {coursePopup.teacher.courses?.length > 0 ? (
                coursePopup.teacher.courses.map((course: any) => {
                  const isExpanded = expandedCourse === course.id;
                  const activeStudents =
                    course.enrollments?.filter(
                      (e: any) => e.status === 'ACTIVE' || e.status === 'COMPLETED'
                    ) || [];
                  return (
                    <div
                      key={course.id}
                      className="rounded-xl border border-slate-100 overflow-hidden"
                    >
                      {/* Course Header — clickable */}
                      <button
                        onClick={() => setExpandedCourse(isExpanded ? null : course.id)}
                        className="w-full flex items-center gap-4 p-4 hover:bg-blue-50/30 transition-colors text-left"
                      >
                        <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center shrink-0">
                          <BookOpen size={18} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold text-slate-900">{course.title}</p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {activeStudents.length} นักเรียน
                          </p>
                        </div>
                        <ChevronDown
                          size={16}
                          className={`text-slate-400 transition-transform shrink-0 ${isExpanded ? 'rotate-180' : ''}`}
                        />
                      </button>

                      {/* Expanded Student List */}
                      {isExpanded && (
                        <div className="border-t border-slate-100 bg-slate-50/50">
                          {activeStudents.length > 0 ? (
                            activeStudents.map((enrollment: any) => (
                              <div
                                key={enrollment.userId}
                                className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 last:border-b-0"
                              >
                                <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden shrink-0">
                                  <img
                                    src={
                                      enrollment.user?.profileImage ||
                                      `https://api.dicebear.com/9.x/avataaars/svg?seed=${enrollment.userId}`
                                    }
                                    alt={enrollment.user?.name || 'Student'}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-bold text-slate-800 truncate">
                                    {enrollment.user?.name || 'ไม่ระบุชื่อ'}
                                  </p>
                                  <p className="text-[10px] text-slate-400">
                                    {enrollment.createdAt
                                      ? new Date(enrollment.createdAt).toLocaleDateString('th-TH', {
                                          day: 'numeric',
                                          month: 'short',
                                          year: 'numeric',
                                        })
                                      : '-'}
                                  </p>
                                </div>
                                <span
                                  className={`px-2 py-0.5 text-[9px] font-bold rounded-full border ${
                                    enrollment.status === 'COMPLETED'
                                      ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                                      : enrollment.status === 'ACTIVE'
                                        ? 'bg-blue-50 text-blue-600 border-blue-200'
                                        : 'bg-slate-50 text-slate-400 border-slate-200'
                                  }`}
                                >
                                  {enrollment.status === 'COMPLETED'
                                    ? 'เรียนจบ'
                                    : enrollment.status === 'ACTIVE'
                                      ? 'กำลังเรียน'
                                      : 'ยกเลิก'}
                                </span>
                              </div>
                            ))
                          ) : (
                            <p className="text-center text-slate-400 text-xs py-4">
                              ยังไม่มีนักเรียน
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <p className="text-center text-slate-400 text-sm py-8">ยังไม่มีคอร์ส</p>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-100 flex items-center justify-between text-sm shrink-0">
              <span className="text-slate-500">รวมทั้งหมด</span>
              <span className="font-black text-blue-600">
                {coursePopup.teacher.courses?.length || 0} คอร์ส
              </span>
            </div>
          </div>
        </div>
      )}
    </AdminTableLayout>
  );
}
