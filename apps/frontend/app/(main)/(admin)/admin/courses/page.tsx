'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import * as XLSX from 'xlsx';
import { categoryApi, levelApi } from '@/app/lib/api';
import { Course, Category, Level } from '@/app/lib/types';
import {
  Edit,
  Trash2,
  Search,
  Eye,
  Plus,
  BookOpen,
  Users,
  FileText,
  Filter,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Download,
} from 'lucide-react';
import { useToast } from '@/app/components/ui/Toast';
import { ConfirmDialog } from '@/app/components/ui/ConfirmDialog';

export default function AdminCoursesPage() {
  const { toast } = useToast();

  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [levels, setLevels] = useState<Level[]>([]);
  const [totalStudents, setTotalStudents] = useState<number>(0);

  // 🌟 เพิ่ม State สำหรับเก็บยอดสรุปจาก DB (เพื่อแก้ปัญหาเลข 10 ให้เป็น 28)
  const [summary, setSummary] = useState({ all: 0, published: 0, draft: 0 });

  // ── Filters ──────────────────────────────────────────────
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [instructorFilter, setInstructorFilter] = useState<string>('all');
  const [instructors, setInstructors] = useState<any[]>([]);

  // ── Pagination ───────────────────────────────────────────
  const [page, setPage] = useState(1);
  const limit = 10;
  const [total, setTotal] = useState(0);

  // ── Delete Confirmation ──────────────────────────────────
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // ── Load reference data & Students Count ─────────────────
  useEffect(() => {
    categoryApi.list().then((r) => {
      if (r.success && r.data) setCategories(r.data);
    });
    levelApi.list().then((r) => {
      if (r.success && r.data) setLevels(r.data);
    });

    const fetchStudentsCount = async () => {
      try {
        const response = await fetch(
          (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api') + '/users/students',
          {
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
          }
        );
        const res = await response.json();
        if (res.success && res.data) {
          setTotalStudents(res.data.pagination?.total || res.data.length || 0);
        }
      } catch (error) {
        console.error('Failed to fetch students count', error);
      }
    };

    const fetchInstructors = async () => {
      try {
        const response = await fetch(
          (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api') + '/users/instructors',
          {
            credentials: 'include',
          }
        );
        const res = await response.json();
        if (res.success) setInstructors(res.data);
      } catch (error) {
        console.error('Failed to fetch instructors', error);
      }
    };

    fetchInstructors();
    fetchStudentsCount();
  }, []);

  // ── Fetch Courses ────────────────────────────────────────
  const fetchCourses = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });
      if (search) params.append('search', search);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (categoryFilter !== 'all') params.append('categoryId', categoryFilter);
      if (typeFilter !== 'all') params.append('courseType', typeFilter);
      if (instructorFilter !== 'all') params.append('instructorId', instructorFilter);

      const response = await fetch(
        (process.env.NEXT_PUBLIC_API_URL ||
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'}`) +
          `/courses/admin?${params.toString()}`,
        {
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          cache: 'no-store', // ✅ ปิดการ Cache (Force dynamic) เพื่อให้ได้ข้อมูลใหม่เสมอ
        }
      );

      const res = await response.json();

      if (res.success && res.data) {
        if (res.data.courses) {
          setCourses(res.data.courses);
          setTotal(res.data.total || res.data.courses.length);
        } else if (Array.isArray(res.data)) {
          setCourses(res.data);
          setTotal(res.data.length);
        }

        // 🌟 บรรทัดสำคัญ: รับค่า summary (เช่น 28 คอร์ส) ที่ส่งมาจาก Backend Service
        if (res.data.summary) {
          setSummary(res.data.summary);
        }
      } else if (res.error === 'No token provided' || res.error === 'jwt expired') {
        console.warn('Token หมดอายุ กรุณาล็อกอินใหม่');
        toast.error('เซสชันหมดอายุ กรุณาล็อกอินใหม่');
      }
    } catch (error) {
      console.error('Failed to fetch courses', error);
      toast.error('ไม่สามารถดึงข้อมูลคอร์สเรียนได้');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCourses();
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, statusFilter, categoryFilter, typeFilter, instructorFilter, page]);

  // ── Stats (ปรับปรุงให้ใช้ค่าจาก summary ที่แม่นยำ 100%) ──────────────────
  const stats = useMemo(
    () => ({
      total: summary.all,
      published: summary.published,
      draft: summary.draft,
      totalStudents: totalStudents,
    }),
    [summary, totalStudents]
  );

  // Helper function to get full category name with hierarchy
  const getCategoryLabel = (category: Category) => {
    if (!category) return '';
    const parent = categories.find((c) => c.id === (category as any).parentId);
    if (parent) {
      return `${parent.name} > ${category.name}`;
    }
    return category.name;
  };

  // ── อัปเดตสถานะคอร์ส (API PATCH) ──────────────────────────
  const handleStatusChange = async (courseId: string, newStatus: string) => {
    try {
      const response = await fetch(
        (process.env.NEXT_PUBLIC_API_URL ||
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'}`) +
          `/courses/${courseId}/status`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ status: newStatus }),
        }
      );

      const res = await response.json();

      if (res.success) {
        toast.success(
          newStatus === 'PUBLISHED'
            ? 'เผยแพร่คอร์สแล้ว! พร้อมขายบนหน้าเว็บ'
            : 'เปลี่ยนเป็นแบบร่างเรียบร้อย'
        );
        // 🌟 เรียก fetchCourses เพื่อให้อัปเดตตัวเลขใน Card ทันทีหลังเปลี่ยนสถานะ
        fetchCourses();
      } else {
        toast.error(res.error || 'เกิดข้อผิดพลาดในการเปลี่ยนสถานะ');
      }
    } catch (error) {
      console.error('Update Status Error:', error);
      toast.error('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้');
    }
  };

  // ── Delete ───────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      const response = await fetch(
        (process.env.NEXT_PUBLIC_API_URL ||
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'}`) +
          `/courses/${deletingId}`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        }
      );
      const res = await response.json();

      if (res.success) {
        toast.success('ลบคอร์สเรียบร้อยแล้ว');
        setDeletingId(null);
        fetchCourses();
      } else {
        toast.error(res.error || 'เกิดข้อผิดพลาดในการลบคอร์ส');
      }
    } catch (error) {
      console.error('Delete Error:', error);
      toast.error('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้');
    }
  };

  const totalPages = Math.ceil(total / limit);

  // ── Export to Excel ──────────────────────────────────────
  const handleExportExcel = async (courseId: string, courseTitle: string) => {
    try {
      const response = await fetch(
        (process.env.NEXT_PUBLIC_API_URL ||
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'}`) +
          `/courses/${courseId}/students`,
        {
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        }
      );
      const res = await response.json();

      if (!res.success) {
        toast.error(res.error || 'ไม่สามารถดึงข้อมูลนักเรียนได้');
        return;
      }

      const rows = (res.data as any[]).map((en) => ({
        ชื่อ: en.user?.name ?? '',
        อีเมล: en.user?.email ?? '',
        เบอร์โทร: en.user?.phone ?? '',
        วันที่ลงทะเบียน: en.createdAt ? new Date(en.createdAt).toLocaleDateString('th-TH') : '',
      }));

      if (rows.length === 0) {
        toast.error('ไม่มีนักเรียนที่ลงทะเบียนในคอร์สนี้');
        return;
      }

      const worksheet = XLSX.utils.json_to_sheet(rows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Students');
      const safeTitle = courseTitle.replace(/[\\/:*?"<>|]/g, '_').slice(0, 50);
      XLSX.writeFile(workbook, `${safeTitle}_students.xlsx`);
      toast.success(`ดาวน์โหลดข้อมูลนักเรียน ${rows.length} คนเรียบร้อย`);
    } catch (error) {
      console.error('Export Excel Error:', error);
      toast.error('เกิดข้อผิดพลาดในการส่งออกข้อมูล');
    }
  };

  // ── Course Type Label ────────────────────────────────────
  const courseTypeLabel = (type: string) => {
    switch (type) {
      case 'ONLINE':
        return '📹 Online';
      case 'ONLINE_LIVE':
        return '🎥 Live';
      case 'ONSITE':
        return '🏫 Onsite';
      default:
        return type;
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* ── Header ─────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">จัดการคอร์สเรียน</h1>
          <p className="text-gray-500 text-sm mt-1">จัดการคอร์สทั้งหมดในระบบ</p>
        </div>
        <Link href="/admin/courses/create">
          <button className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 transition-all shadow-sm hover:shadow-md">
            <Plus size={18} /> เพิ่มคอร์สใหม่
          </button>
        </Link>
      </div>

      {/* ── Stats Cards ────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: 'ทั้งหมด',
            value: stats.total,
            icon: BookOpen,
            color: 'text-blue-600',
            bg: 'bg-blue-50',
          },
          {
            label: 'เผยแพร่',
            value: stats.published,
            icon: Eye,
            color: 'text-green-600',
            bg: 'bg-green-50',
          },
          {
            label: 'แบบร่าง',
            value: stats.draft,
            icon: FileText,
            color: 'text-gray-600',
            bg: 'bg-gray-100',
          },
          {
            label: 'นักเรียนรวม',
            value: stats.totalStudents,
            icon: Users,
            color: 'text-purple-600',
            bg: 'bg-purple-50',
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${stat.bg}`}>
                <stat.icon size={18} className={stat.color} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-xs text-gray-500">{stat.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Filters ────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="ค้นหาชื่อคอร์ส..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          </div>
          {/* Status */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm bg-white min-w-[140px]"
          >
            <option value="all">สถานะทั้งหมด</option>
            <option value="PUBLISHED">เผยแพร่แล้ว</option>
            <option value="DRAFT">แบบร่าง</option>
          </select>
          {/* Toggle More Filters */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2.5 border rounded-lg text-sm transition-colors ${showFilters ? 'border-primary bg-primary/5 text-primary' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
          >
            <Filter size={16} /> ตัวกรองเพิ่มเติม
          </button>
        </div>

        {/* Extended Filters */}
        {showFilters && (
          <div className="flex flex-col md:flex-row gap-3 pt-2 border-t border-gray-100 animate-fade-in-up">
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setPage(1);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm bg-white min-w-[160px]"
            >
              <option value="all">หมวดหมู่ทั้งหมด</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {getCategoryLabel(c)}
                </option>
              ))}
            </select>
            <select
              value={instructorFilter}
              onChange={(e) => {
                setInstructorFilter(e.target.value);
                setPage(1);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm bg-white min-w-[160px]"
            >
              <option value="all">ผู้สอนทั้งหมด</option>
              {instructors.map((inst) => (
                <option key={inst.id} value={inst.id}>
                  {inst.name}
                </option>
              ))}
            </select>
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPage(1);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm bg-white min-w-[140px]"
            >
              <option value="all">ประเภททั้งหมด</option>
              <option value="ONLINE">📹 Online (VDO)</option>
              <option value="ONLINE_LIVE">🎥 Live (Zoom)</option>
              <option value="ONSITE">🏫 Onsite</option>
            </select>
            <button
              onClick={() => {
                setCategoryFilter('all');
                setTypeFilter('all');
                setStatusFilter('all');
                setInstructorFilter('all');
                setSearch('');
                setPage(1);
              }}
              className="text-sm text-gray-500 hover:text-primary underline"
            >
              ล้างตัวกรอง
            </button>
          </div>
        )}
      </div>

      {/* ── Table ──────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-200">
                <th className="px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  คอร์ส
                </th>
                <th className="px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  ราคา
                </th>
                <th className="px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">
                  ประเภท
                </th>
                <th className="px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                  ผู้สอน
                </th>
                <th className="px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">
                  สถานะ
                </th>
                <th className="px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">
                  จัดการ
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                [...Array(limit)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-14 h-10 bg-gray-100 rounded-lg" />
                        <div className="space-y-2">
                          <div className="h-4 bg-gray-100 rounded w-48" />
                          <div className="h-3 bg-gray-100 rounded w-24" />
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="h-4 bg-gray-100 rounded w-16" />
                    </td>
                    <td className="px-5 py-4 hidden md:table-cell">
                      <div className="h-4 bg-gray-100 rounded w-16" />
                    </td>
                    <td className="px-5 py-4 hidden lg:table-cell">
                      <div className="h-4 bg-gray-100 rounded w-24" />
                    </td>
                    <td className="px-5 py-4 text-center">
                      <div className="h-6 bg-gray-100 rounded-full w-20 mx-auto" />
                    </td>
                    <td className="px-5 py-4 text-center">
                      <div className="h-8 bg-gray-100 rounded-lg w-24 mx-auto" />
                    </td>
                  </tr>
                ))
              ) : courses.length > 0 ? (
                courses.map((course) => (
                  <tr key={course.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        {course.thumbnail ? (
                          <img
                            src={course.thumbnail}
                            alt={course.title}
                            className="w-14 h-10 rounded-lg object-cover border border-gray-200 flex-shrink-0"
                          />
                        ) : (
                          <div className="w-14 h-10 rounded-lg bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center text-blue-400 flex-shrink-0">
                            <BookOpen size={16} />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 truncate max-w-[300px]">
                            {course.title}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {course.category?.name || 'ไม่มีหมวดหมู่'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-gray-900">
                          {course.price > 0 ? (
                            `฿${course.price.toLocaleString()}`
                          ) : (
                            <span className="text-green-600">ฟรี</span>
                          )}
                        </span>
                        {course.originalPrice && course.originalPrice > course.price && (
                          <span className="text-xs text-gray-400 line-through">
                            ฿{course.originalPrice.toLocaleString()}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4 hidden md:table-cell">
                      <span className="text-xs text-gray-600">
                        {courseTypeLabel(course.courseType)}
                      </span>
                    </td>
                    <td className="px-5 py-4 hidden lg:table-cell">
                      <span className="text-sm text-gray-600">
                        {course.instructor?.name || '-'}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-center">
                      <select
                        value={course.status}
                        onChange={(e) => handleStatusChange(course.id, e.target.value)}
                        className={`text-xs font-semibold rounded-lg px-4 py-1.5 outline-none cursor-pointer border text-center shadow-sm hover:shadow transition-all ${
                          course.status === 'PUBLISHED'
                            ? 'bg-green-100 text-green-700 border-green-200 hover:bg-green-200'
                            : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'
                        }`}
                        style={{ WebkitAppearance: 'none', appearance: 'none' }}
                      >
                        <option value="PUBLISHED" className="bg-white text-gray-900">
                          เผยแพร่แล้ว
                        </option>
                        <option value="DRAFT" className="bg-white text-gray-900">
                          แบบร่าง
                        </option>
                      </select>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center justify-center gap-1">
                        <Link href={`/course/${course.id}`} target="_blank">
                          <button
                            className="p-2 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                            title="ดูตัวอย่าง"
                          >
                            <Eye size={16} />
                          </button>
                        </Link>
                        {course.courseType !== 'ONLINE' && (
                          <Link href={`/admin/courses/${course.id}/seats`}>
                            <button
                              className="p-2 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-all"
                              title="จัดการที่นั่ง"
                            >
                              <Users size={16} />
                            </button>
                          </Link>
                        )}
                        <Link href={`/admin/courses/${course.id}/edit`}>
                          <button
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                            title="แก้ไข"
                          >
                            <Edit size={16} />
                          </button>
                        </Link>
                        <button
                          onClick={() => handleExportExcel(course.id, course.title)}
                          className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                          title="Export นักเรียน (.xlsx)"
                        >
                          <Download size={16} />
                        </button>
                        <button
                          onClick={() => setDeletingId(course.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                          title="ลบ"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
                        <BookOpen size={28} className="text-gray-400" />
                      </div>
                      <div>
                        <p className="text-gray-900 font-medium">ยังไม่มีคอร์สเรียน</p>
                        <p className="text-gray-500 text-sm mt-1">สร้างคอร์สแรกของคุณเลย!</p>
                      </div>
                      <Link href="/admin/courses/create">
                        <button className="mt-2 flex items-center gap-2 px-5 py-2.5 bg-primary text-white text-sm font-medium rounded-xl hover:bg-primary/90 transition-all shadow-sm">
                          <Plus size={16} /> สร้างคอร์สใหม่
                        </button>
                      </Link>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ── Pagination ──────────────────────────────── */}
        {total > 0 && (
          <div className="px-5 py-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="text-sm text-gray-500">
              แสดง {courses.length} จากทั้งหมด {total} รายการ
            </span>
            <div className="flex items-center gap-1">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="p-2 border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const pageNum = i + 1;
                return (
                  <button
                    key={i}
                    onClick={() => setPage(pageNum)}
                    className={`w-9 h-9 text-sm rounded-lg transition-colors ${page === pageNum ? 'bg-primary text-white font-medium' : 'border border-gray-300 hover:bg-gray-50'}`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              {totalPages > 5 && (
                <span className="px-2 text-gray-400">
                  <MoreHorizontal size={16} />
                </span>
              )}
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="p-2 border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Delete Confirmation ─────────────────────────── */}
      <ConfirmDialog
        open={!!deletingId}
        onCancel={() => setDeletingId(null)}
        onConfirm={handleDelete}
        title="ลบคอร์สเรียน"
        message="คุณแน่ใจหรือไม่ที่จะลบคอร์สนี้? การกระทำนี้ไม่สามารถย้อนกลับได้"
        variant="danger"
      />
    </div>
  );
}
