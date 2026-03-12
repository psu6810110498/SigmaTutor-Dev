'use client';

// ============================================================
// Admin Reviews Management Page (Grouped by Course)
// Path: /admin/reviews
// ============================================================

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Star, Eye, Loader2, ArrowRight } from 'lucide-react';
import { useToast } from '@/app/components/ui/Toast';
import { reviewApi } from '@/app/lib/api';

interface CourseReviewStat {
  id: string;
  title: string;
  slug: string;
  thumbnail?: string | null;
  totalReviews: number;
  averageRating: number;
}

export default function AdminReviewsPage() {
  const [courses, setCourses] = useState<CourseReviewStat[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const res = await reviewApi.adminCourseList();
      
      if (res.success && res.data) {
        setCourses(res.data);
      } else {
        toast.error(res.error || 'ดึงข้อมูลคอร์สที่มีรีวิวไม่สำเร็จ');
      }
    } catch (error) {
      console.error('Failed to fetch admin course stats:', error);
      toast.error('ดึงข้อมูลรีวิวไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const renderStars = (rating: number) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    return (
      <div className="flex items-center gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            size={14}
            className={
              i < fullStars 
                ? 'text-yellow-400 fill-yellow-400' 
                : i === fullStars && hasHalfStar 
                  ? 'text-yellow-400 fill-yellow-400 opacity-50' 
                  : 'text-gray-200'
            }
          />
        ))}
        <span className="ml-2 text-sm font-bold text-gray-700">{rating.toFixed(1)}</span>
      </div>
    );
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900">
            จัดการรีวิว (Reviews)
          </h1>
          <p className="text-gray-500 mt-1">เลือกคอร์สเรียนเพื่อตรวจสอบและจัดการรีวิว</p>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 text-gray-500 text-sm font-medium border-b border-gray-100">
                <th className="p-4 whitespace-nowrap">คอร์สเรียน</th>
                <th className="p-4 text-center whitespace-nowrap">จำนวนรีวิว (ครั้ง)</th>
                <th className="p-4 whitespace-nowrap">คะแนนเฉลี่ย</th>
                <th className="p-4 text-right whitespace-nowrap">การจัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={4} className="p-12 text-center text-gray-500">
                    <Loader2 size={32} className="animate-spin text-primary mx-auto mb-3" />
                    กำลังโหลดข้อมูล...
                  </td>
                </tr>
              ) : courses.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-12 text-center text-gray-500">
                    ไม่พบข้อมูลคอร์สที่มีรีวิว
                  </td>
                </tr>
              ) : (
                courses.map((course) => (
                  <tr key={course.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="p-4 align-middle">
                      <div className="flex items-center gap-3">
                        {course.thumbnail ? (
                          <img
                            src={course.thumbnail}
                            alt={course.title}
                            className="w-12 h-10 rounded-md object-cover border border-gray-100 bg-gray-50 shrink-0"
                          />
                        ) : (
                          <div className="w-12 h-10 rounded-md bg-gray-100 flex items-center justify-center shrink-0">
                            <Star size={16} className="text-gray-300" />
                          </div>
                        )}
                        <div className="font-bold text-gray-900 line-clamp-2">
                          {course.title}
                        </div>
                      </div>
                    </td>
                    <td className="p-4 align-middle text-center">
                      <span className="inline-flex items-center justify-center min-w-[2.5rem] h-10 px-3 rounded-full bg-blue-50 text-blue-700 font-bold">
                        {course.totalReviews}
                      </span>
                    </td>
                    <td className="p-4 align-middle">
                      {renderStars(course.averageRating)}
                    </td>
                    <td className="p-4 align-middle text-right">
                      <Link
                        href={`/admin/reviews/${course.id}`}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 hover:text-primary hover:border-primary/50 transition-all font-medium text-sm shadow-sm group-hover:shadow-md"
                      >
                        <Eye size={16} />
                        ดูรีวิว
                        <ArrowRight size={16} className="text-gray-400 group-hover:translate-x-0.5 transition-transform" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
