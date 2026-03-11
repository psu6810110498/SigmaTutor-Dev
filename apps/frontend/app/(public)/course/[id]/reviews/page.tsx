'use client';

// ============================================================
// Full Course Reviews Page 
// Path: /course/[id]/reviews
// ============================================================

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Star, 
  ThumbsUp, 
  Loader2, 
  BookOpen 
} from 'lucide-react';
import { reviewApi, courseApi } from '@/app/lib/api';
import type { Review, ReviewListResponse, Course } from '@/app/lib/types';

export default function FullReviewsPage() {
  const params = useParams();
  const slug = params.id as string;
  
  const [course, setCourse] = useState<Course | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewStats, setReviewStats] = useState<ReviewListResponse['stats'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // 1. Fetch Course details (to display title)
  useEffect(() => {
    const fetchCourse = async () => {
      let res = await courseApi.getBySlug(slug);
      if (!res.success) {
        res = await courseApi.getById(slug);
      }
      if (res.success && res.data) {
        setCourse(res.data);
      }
    };
    fetchCourse();
  }, [slug]);

  // 2. Fetch Reviews for this course (paginated)
  useEffect(() => {
    if (!course) return;
    
    const fetchReviews = async () => {
      setLoading(true);
      const res = await reviewApi.list({ courseId: course.id, page, limit: 10 });
      if (res.success && res.data) {
        if (page === 1) {
          setReviews(res.data.reviews);
        } else {
          setReviews(prev => [...prev, ...res.data!.reviews]);
        }
        setReviewStats(res.data.stats);
        setTotalPages(res.data.pagination.totalPages);
      }
      setLoading(false);
    };
    
    fetchReviews();
  }, [course, page]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('th-TH', { 
      day: 'numeric', month: 'short', year: 'numeric' 
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
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-[70vh]">
      {/* Back Button */}
      <Link
        href={`/explore/${slug}`}
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-primary mb-6 transition-colors"
      >
        <ArrowLeft size={16} /> กลับไปหน้าคอร์สเรียน
      </Link>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
          รีวิวทั้งหมด
        </h1>
        {course ? (
          <p className="text-gray-600 flex items-center gap-2">
            <BookOpen size={18} className="text-primary" />
            {course.title}
          </p>
        ) : (
          <div className="h-6 w-64 bg-gray-100 animate-pulse rounded"></div>
        )}
      </div>

      {loading && page === 1 ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-primary" size={32} />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Review Stats Summary */}
          {reviewStats && reviewStats.total > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6 flex flex-col sm:flex-row items-center sm:items-start gap-8 shadow-sm">
              <div className="text-center sm:text-left flex flex-col items-center sm:items-start">
                <p className="text-5xl font-bold text-gray-900 leading-none mb-2">
                  {reviewStats.average.toFixed(1)}
                </p>
                {renderStars(reviewStats.average)}
                <p className="text-xs text-gray-400 mt-2">{reviewStats.total} รีวิว</p>
              </div>
              
              <div className="flex-1 space-y-2 w-full max-w-sm">
                {Array.from({ length: 5 }, (_, i) => 5 - i).map((star) => {
                  const dist = reviewStats.distribution.find((d) => d.rating === star);
                  const count = dist?.count || 0;
                  const pct = reviewStats.total > 0 ? (count / reviewStats.total) * 100 : 0;
                  return (
                    <div key={star} className="flex items-center gap-3">
                      <span className="text-xs font-medium text-gray-600 w-3">{star}</span>
                      <Star size={12} className="text-yellow-400 fill-yellow-400" />
                      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-yellow-400 rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-400 w-8 text-right font-medium">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* List of Reviews */}
          {reviews.length === 0 ? (
            <div className="text-center py-16 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
              <Star size={48} className="mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-bold text-gray-900 mb-1">ยังไม่มีผู้เขียนรีวิว</h3>
              <p className="text-gray-500 text-sm">เป็นคนแรกที่รีวิวคอร์สนี้สิ!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <div
                  key={review.id}
                  className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {review.user.profileImage ? (
                        <img 
                          src={review.user.profileImage} 
                          alt={review.user.name} 
                          className="w-10 h-10 rounded-full object-cover border border-gray-100 shadow-sm"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-gradient-to-br from-primary/10 to-primary/5 rounded-full flex items-center justify-center text-primary font-bold text-sm shadow-sm border border-primary/10">
                          {review.user.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="font-bold text-gray-900">
                          {review.user.name}
                        </p>
                        <p className="text-xs text-gray-400">
                          {formatDate(review.createdAt)}
                        </p>
                      </div>
                    </div>
                    {renderStars(review.rating)}
                  </div>
                  
                  {review.comment ? (
                    <p className="text-sm text-gray-700 mt-3 leading-relaxed">
                      {review.comment}
                    </p>
                  ) : (
                    <p className="text-sm text-gray-400 italic mt-3">ไม่มีความคิดเห็น</p>
                  )}
                  
                  <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between">
                    <button className="text-xs font-medium text-gray-400 hover:text-primary flex items-center gap-1.5 transition-colors">
                      <ThumbsUp size={14} /> 
                      {review.helpful > 0 ? `เป็นประโยชน์ (${review.helpful})` : 'มีประโยชน์?'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Load More Button */}
          {page < totalPages && (
            <div className="text-center pt-4">
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={loading}
                className="px-6 py-2.5 bg-white border-2 border-primary text-primary text-sm font-bold rounded-xl hover:bg-primary/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
              >
                {loading && <Loader2 size={16} className="animate-spin" />}
                โหลดเพิ่มเติม
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
