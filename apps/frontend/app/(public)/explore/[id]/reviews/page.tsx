"use client";

// ============================================================
// Course Reviews Page — /explore/[id]/reviews
// Full review listing with rating filter, sort, pagination
// ============================================================

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Star, ThumbsUp, ShoppingCart, Loader2, BookOpen } from "lucide-react";
import { courseApi, reviewApi } from "@/app/lib/api";
import { useCourse, toCartItem } from "@/app/context/CourseContext";
import type { Course, Review, ReviewListResponse, Pagination, ReviewQueryParams } from "@/app/lib/types";

export default function CourseReviewsPage() {
    const params = useParams();
    const slug = params.id as string;
    const { addToCart, isInCart } = useCourse();

    const [course, setCourse] = useState<Course | null>(null);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [stats, setStats] = useState<ReviewListResponse["stats"] | null>(null);
    const [pagination, setPagination] = useState<Pagination | null>(null);
    const [loading, setLoading] = useState(true);

    // Filters
    const [selectedRating, setSelectedRating] = useState(0); // 0 = all
    const [sortBy, setSortBy] = useState<"createdAt" | "rating" | "helpful">("createdAt");
    const [page, setPage] = useState(1);

    // ── Helpers ───────────────────────────────────────────
    const formatPrice = (n: number) =>
        new Intl.NumberFormat("th-TH", { minimumFractionDigits: 0 }).format(n);

    const formatDate = (d: string) =>
        new Date(d).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" });

    const renderStars = (rating: number) => (
        <div className="flex items-center gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
                <Star
                    key={i}
                    size={14}
                    className={i < Math.round(rating) ? "text-yellow-400 fill-yellow-400" : "text-gray-200"}
                />
            ))}
        </div>
    );

    // ── Fetch Course ──────────────────────────────────────
    useEffect(() => {
        const fetchCourse = async () => {
            let res = await courseApi.getBySlug(slug);
            if (!res.success) res = await courseApi.getById(slug);
            if (res.success && res.data) setCourse(res.data);
        };
        fetchCourse();
    }, [slug]);

    // ── Fetch Reviews ─────────────────────────────────────
    const fetchReviews = useCallback(async () => {
        if (!course) return;
        setLoading(true);

        const queryParams: ReviewQueryParams = {
            courseId: course.id,
            page,
            limit: 10,
            sort: sortBy,
            order: "desc",
        };
        if (selectedRating > 0) queryParams.rating = selectedRating;

        const res = await reviewApi.list(queryParams);
        if (res.success && res.data) {
            setReviews(res.data.reviews);
            setStats(res.data.stats);
            setPagination(res.data.pagination);
        }
        setLoading(false);
    }, [course, page, sortBy, selectedRating]);

    useEffect(() => { fetchReviews(); }, [fetchReviews]);

    // ── Loading ───────────────────────────────────────────
    if (!course) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="animate-spin text-primary" size={32} />
                <span className="ml-3 text-gray-500">กำลังโหลด...</span>
            </div>
        );
    }

    // ============================================================
    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Back */}
            <Link
                href={`/explore/${slug}`}
                className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-primary mb-6 transition-colors"
            >
                <ArrowLeft size={16} /> กลับหน้ารายละเอียดคอร์ส
            </Link>

            <div className="flex flex-col lg:flex-row gap-8">
                {/* ═══════════════════════════ Left — Course Card + Stats */}
                <aside className="lg:w-80 flex-shrink-0">
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden sticky top-28">
                        {/* Thumbnail */}
                        <div className="h-40 bg-gray-100 relative">
                            {course.thumbnailSm ? (
                                <img src={course.thumbnailSm} alt={course.title} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center"><BookOpen className="text-gray-200" size={48} /></div>
                            )}
                        </div>
                        <div className="p-5">
                            <h3 className="font-bold text-gray-900 mb-1 line-clamp-2 text-sm">{course.title}</h3>
                            <p className="text-xs text-gray-500 mb-3">{course.instructor?.name}</p>
                            <div className="mb-4">
                                {course.originalPrice && course.originalPrice > course.price && (
                                    <span className="text-xs text-gray-400 line-through mr-2">฿{formatPrice(course.originalPrice)}</span>
                                )}
                                <span className="text-xl font-bold text-primary">฿{formatPrice(course.price)}</span>
                            </div>
                            <button
                                onClick={() => addToCart(toCartItem(course))}
                                disabled={isInCart(course.id)}
                                className={`w-full py-2.5 rounded-xl text-sm font-bold transition-all ${isInCart(course.id)
                                    ? "bg-green-50 text-green-600"
                                    : "bg-primary text-white hover:bg-primary-dark shadow-lg shadow-primary/20"
                                    }`}
                            >
                                {isInCart(course.id) ? "✓ ในตะกร้า" : "สมัครเรียนทันที"}
                            </button>
                        </div>

                        {/* Rating Summary */}
                        {stats && (
                            <div className="border-t border-gray-100 p-5">
                                <div className="text-center mb-4">
                                    <p className="text-4xl font-bold text-gray-900">{stats.average.toFixed(1)}</p>
                                    <div className="flex justify-center my-1">{renderStars(stats.average)}</div>
                                    <p className="text-xs text-gray-400">{stats.total} รีวิวทั้งหมด</p>
                                </div>
                                <div className="space-y-1.5">
                                    {Array.from({ length: 5 }, (_, i) => 5 - i).map((star) => {
                                        const dist = stats.distribution.find((d) => d.rating === star);
                                        const count = dist?.count || 0;
                                        const pct = stats.total > 0 ? (count / stats.total) * 100 : 0;
                                        return (
                                            <button
                                                key={star}
                                                onClick={() => { setSelectedRating(selectedRating === star ? 0 : star); setPage(1); }}
                                                className={`w-full flex items-center gap-2 py-1 px-2 rounded-lg text-xs transition-colors ${selectedRating === star ? "bg-yellow-50" : "hover:bg-gray-50"
                                                    }`}
                                            >
                                                <span className="w-4 text-gray-500">{star}</span>
                                                <Star size={10} className="text-yellow-400 fill-yellow-400" />
                                                <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                    <div className="h-full bg-yellow-400 rounded-full" style={{ width: `${pct}%` }} />
                                                </div>
                                                <span className="w-6 text-gray-400 text-right">{count}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                </aside>

                {/* ═══════════════════════════ Right — Reviews */}
                <div className="flex-1 min-w-0">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
                        <h1 className="text-xl font-bold text-gray-900">
                            รีวิวจากผู้เรียน
                            {selectedRating > 0 && (
                                <span className="ml-2 text-sm font-normal text-gray-400">
                                    — กรอง: {selectedRating} ดาว
                                    <button onClick={() => setSelectedRating(0)} className="ml-2 text-primary hover:underline">ล้าง</button>
                                </span>
                            )}
                        </h1>
                        <select
                            value={sortBy}
                            onChange={(e) => { setSortBy(e.target.value as any); setPage(1); }}
                            className="px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 bg-white focus:border-primary outline-none"
                        >
                            <option value="createdAt">ล่าสุด</option>
                            <option value="rating">คะแนนสูงสุด</option>
                            <option value="helpful">มีประโยชน์มากสุด</option>
                        </select>
                    </div>

                    {/* Filter Tabs */}
                    <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
                        {[0, 5, 4, 3, 2, 1].map((star) => (
                            <button
                                key={star}
                                onClick={() => { setSelectedRating(star); setPage(1); }}
                                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium border transition-all ${selectedRating === star
                                    ? "bg-primary text-white border-primary"
                                    : "bg-white text-gray-600 border-gray-200 hover:border-primary hover:text-primary"
                                    }`}
                            >
                                {star === 0 ? "ทั้งหมด" : `${star} ดาว`}
                            </button>
                        ))}
                    </div>

                    {/* Review List */}
                    {loading ? (
                        <div className="space-y-4">
                            {Array.from({ length: 3 }).map((_, i) => (
                                <div key={i} className="bg-white rounded-xl border border-gray-100 p-5 animate-pulse">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-9 h-9 bg-gray-100 rounded-full" />
                                        <div className="space-y-1.5">
                                            <div className="h-4 bg-gray-100 rounded w-24" />
                                            <div className="h-3 bg-gray-100 rounded w-16" />
                                        </div>
                                    </div>
                                    <div className="h-4 bg-gray-100 rounded w-full" />
                                    <div className="h-4 bg-gray-100 rounded w-3/4 mt-2" />
                                </div>
                            ))}
                        </div>
                    ) : reviews.length === 0 ? (
                        <div className="text-center py-16">
                            <Star size={48} className="text-gray-200 mx-auto mb-4" />
                            <h3 className="text-lg font-bold text-gray-500 mb-2">
                                {selectedRating > 0 ? `ไม่มีรีวิว ${selectedRating} ดาว` : "ยังไม่มีรีวิว"}
                            </h3>
                            <p className="text-gray-400 text-sm">
                                {selectedRating > 0 ? "ลองเลือกระดับดาวอื่น" : "เป็นคนแรกที่รีวิวคอร์สนี้!"}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {reviews.map((review) => (
                                <div key={review.id} className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-sm transition-shadow">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold text-sm">
                                                {review.user.name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900 text-sm">{review.user.name}</p>
                                                <p className="text-xs text-gray-400">{formatDate(review.createdAt)}</p>
                                            </div>
                                        </div>
                                        {renderStars(review.rating)}
                                    </div>
                                    {review.comment && (
                                        <p className="text-sm text-gray-600 leading-relaxed">{review.comment}</p>
                                    )}
                                    <div className="mt-3 pt-3 border-t border-gray-50 flex items-center gap-4">
                                        <button className="text-xs text-gray-400 hover:text-primary flex items-center gap-1 transition-colors">
                                            <ThumbsUp size={12} /> มีประโยชน์ ({review.helpful})
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Pagination */}
                    {pagination && pagination.totalPages > 1 && (
                        <div className="mt-8 flex justify-center gap-2">
                            <button
                                disabled={!pagination.hasPrev}
                                onClick={() => setPage((p) => p - 1)}
                                className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:border-primary disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                                ← ก่อนหน้า
                            </button>
                            <span className="px-4 py-2 text-sm text-gray-500">
                                {pagination.page} / {pagination.totalPages}
                            </span>
                            <button
                                disabled={!pagination.hasNext}
                                onClick={() => setPage((p) => p + 1)}
                                className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:border-primary disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                                ถัดไป →
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
