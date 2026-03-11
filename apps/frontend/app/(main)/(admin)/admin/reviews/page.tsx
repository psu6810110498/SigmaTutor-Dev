'use client';

// ============================================================
// Admin Reviews Management Page
// Path: /admin/reviews
// ============================================================

import { useState, useEffect } from 'react';
import { Star, Eye, EyeOff, Loader2, ArrowLeft, ArrowRight } from 'lucide-react';
import { useToast } from '@/app/components/ui/Toast';
import type { Review } from '@/app/lib/types';
import { reviewApi } from '@/app/lib/api';

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const { toast } = useToast();

  const fetchReviews = async (pageNum: number) => {
    setLoading(true);
    try {
      const res = await reviewApi.adminList({ page: pageNum, limit: 10 });
      
      if (res.success && res.data) {
        setReviews(res.data.reviews);
        setTotalPages(res.data.pagination.totalPages);
        setPage(res.data.pagination.page);
      } else {
        toast.error(res.error || 'ดึงข้อมูลรีวิวไม่สำเร็จ');
      }
    } catch (error) {
      console.error('Failed to fetch admin reviews:', error);
      toast.error('ดึงข้อมูลรีวิวไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews(page);
  }, [page]);

  const toggleVisibility = async (reviewId: string, currentStatus: boolean) => {
    try {
      const res = await reviewApi.toggleVisibility(reviewId);
      
      if (res.success && res.data) {
        setReviews(reviews.map(r => r.id === reviewId ? { ...r, isHidden: res.data!.isHidden } : r));
        const statusMsg = res.data.isHidden ? 'ซ่อนรีวิวนี้แล้ว' : 'แสดงรีวิวนี้แล้ว';
        toast.success(statusMsg);
      } else {
        toast.error(res.error || 'เกิดข้อผิดพลาดในการเปลี่ยนสถานะ');
      }
    } catch (error) {
      console.error('Failed to toggle visibility:', error);
      toast.error('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('th-TH', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderStars = (rating: number) => (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={14}
          className={i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}
        />
      ))}
    </div>
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
              <Star size={24} className="fill-primary text-primary" />
            </div>
            จัดการรีวิว (Reviews)
          </h1>
          <p className="text-gray-500 mt-1">ตรวจสอบและจัดการรีวิวคอร์สเรียนทั้งหมด</p>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 text-gray-500 text-sm font-medium border-b border-gray-100">
                <th className="p-4 whitespace-nowrap">ผู้ใช้ / วันที่</th>
                <th className="p-4 whitespace-nowrap">คอร์สเรียน</th>
                <th className="p-4">คะแนน & ความคิดเห็น</th>
                <th className="p-4 text-center whitespace-nowrap">สถานะ</th>
                <th className="p-4 text-right whitespace-nowrap">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-gray-500">
                    <Loader2 size={32} className="animate-spin text-primary mx-auto mb-3" />
                    กำลังโหลดข้อมูลรีวิว...
                  </td>
                </tr>
              ) : reviews.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-gray-500">
                    ไม่พบข้อมูลรีวิวในระบบ
                  </td>
                </tr>
              ) : (
                reviews.map((review: any) => (
                  <tr key={review.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-4 align-top">
                      <div className="font-medium text-gray-900">{review.user.name}</div>
                      <div className="text-xs text-gray-500 mt-1">{review.user.email}</div>
                      <div className="text-xs text-gray-400 mt-2">{formatDate(review.createdAt)}</div>
                    </td>
                    <td className="p-4 align-top min-w-[200px]">
                      <div className="text-sm font-bold text-gray-900 line-clamp-2">
                        {review.course.title}
                      </div>
                    </td>
                    <td className="p-4 align-top max-w-md">
                      <div className="mb-2">{renderStars(review.rating)}</div>
                      {review.comment ? (
                        <p className="text-sm text-gray-600 line-clamp-3">{review.comment}</p>
                      ) : (
                        <p className="text-sm text-gray-400 italic">ไม่มีความคิดเห็น</p>
                      )}
                    </td>
                    <td className="p-4 align-top text-center">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                          review.isHidden
                            ? 'bg-red-50 text-red-600 border border-red-200'
                            : 'bg-green-50 text-green-600 border border-green-200'
                        }`}
                      >
                        {review.isHidden ? 'ซ่อนอยู่' : 'แสดงผล'}
                      </span>
                    </td>
                    <td className="p-4 align-top text-right">
                      <button
                        onClick={() => toggleVisibility(review.id, review.isHidden)}
                        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
                          review.isHidden
                            ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                            : 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100'
                        }`}
                        title={review.isHidden ? "คลิกเพื่อแสดง" : "คลิกเพื่อซ่อน"}
                      >
                        {review.isHidden ? <Eye size={16} /> : <EyeOff size={16} />}
                        {review.isHidden ? 'แสดงผล' : 'ซ่อน'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="p-4 border-t border-gray-100 flex items-center justify-between text-sm">
            <span className="text-gray-500">
              หน้า {page} จาก {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ArrowLeft size={16} />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
