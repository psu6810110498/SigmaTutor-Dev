// ============================================================
// Shared TypeScript Types — Course Management System
// Matches backend Prisma models + API response shapes
// ============================================================

// ── Enums ─────────────────────────────────────────────────

export type CourseType = 'ONLINE' | 'ONLINE_LIVE' | 'ONSITE';
export type CourseStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

// ── Models ────────────────────────────────────────────────

export interface Category {
    id: string;
    name: string;
    slug: string;
    _count?: { courses: number };
}

export interface Level {
    id: string;
    name: string;
    slug: string;
    order: number;
    _count?: { courses: number };
}

export interface Instructor {
    id: string;
    name: string;
    email?: string;
}

export interface Course {
    id: string;
    title: string;
    slug: string;
    description: string | null;
    price: number;
    originalPrice: number | null;
    status: CourseStatus;
    courseType: CourseType;

    // Thumbnails (3 sizes)
    thumbnail: string | null;
    thumbnailSm: string | null;
    thumbnailLg: string | null;

    // Relations
    categoryId: string | null;
    category: Category | null;
    levelId: string | null;
    level: Level | null;
    instructor: Instructor;

    // Details
    duration: string | null;
    videoCount: number;
    maxSeats: number | null;
    enrollStartDate: string | null;
    enrollEndDate: string | null;
    location: string | null;
    mapUrl: string | null;
    zoomLink: string | null;
    published: boolean;

    createdAt: string;
    updatedAt: string;

    // Counts
    _count?: {
        enrollments: number;
        reviews: number;
    };

    // Detail-only (included in findById)
    chapters?: Chapter[];
    schedules?: CourseSchedule[];
    reviews?: Review[];
}

export interface Chapter {
    id: string;
    title: string;
    order: number;
    lessons: Lesson[];
}

export interface Lesson {
    id: string;
    title: string;
    type: 'VIDEO' | 'FILE' | 'QUIZ';
    content: string | null;
    youtubeUrl: string | null;
    duration: number | null;
    order: number;
    chapterId: string;
}

export interface CourseSchedule {
    id: string;
    date: string;
    startTime: string; // ISO String
    endTime: string;   // ISO String
    topic: string;
    location: string | null;
    isOnline: boolean;
    courseId: string;
}

export interface Review {
    id: string;
    rating: number;
    comment: string | null;
    helpful: number;
    userId: string;
    user: { id: string; name: string };
    courseId: string;
    createdAt: string;
}

// ── API Response Shapes ───────────────────────────────────

export interface Pagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
}

export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    details?: { field: string; message: string }[];
}

export interface CourseListResponse {
    courses: Course[];
    pagination: Pagination;
}

export interface ReviewListResponse {
    reviews: Review[];
    stats: {
        average: number;
        total: number;
        distribution: { rating: number; count: number }[];
    };
    pagination: Pagination;
}

// ── Input Types (for forms) ──────────────────────────────

export interface CreateCourseInput {
    title: string;
    description?: string;
    price: number;
    originalPrice?: number | null;
    courseType: CourseType;
    categoryId?: string | null;
    levelId?: string | null;
    duration?: string | null;
    videoCount?: number;
    maxSeats?: number | null;
    enrollStartDate?: string | null;
    enrollEndDate?: string | null;
    location?: string | null;
    mapUrl?: string | null;
    zoomLink?: string | null;
    published?: boolean;
}

export interface CourseQueryParams {
    search?: string;
    status?: CourseStatus;
    courseType?: CourseType;
    categoryId?: string;
    levelId?: string;
    minPrice?: number;
    maxPrice?: number;
    published?: boolean;
    page?: number;
    limit?: number;
    sort?: 'price' | 'createdAt' | 'title';
    order?: 'asc' | 'desc';
}

export interface ReviewQueryParams {
    courseId: string;
    rating?: number;
    page?: number;
    limit?: number;
    sort?: 'createdAt' | 'rating' | 'helpful';
    order?: 'asc' | 'desc';
}
