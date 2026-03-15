// ============================================================
// Shared TypeScript Types — Course Management System
// Matches backend Prisma models + API response shapes
// ============================================================

// ── Enums ─────────────────────────────────────────────────

export type CourseType = 'ONLINE' | 'ONLINE_LIVE' | 'ONSITE';

// ── Seat Availability ─────────────────────────────────────

export interface CourseAvailability {
  courseId: string;
  courseType: CourseType;
  /** false for ONLINE courses (no seat limit) */
  isLimited: boolean;
  maxSeats: number | null;
  enrolledCount: number;
  reservedCount: number;
  /** null means unlimited */
  remaining: number | null;
  isFull: boolean;
  /** true when full only due to active reservations, not confirmed enrollments */
  isReservedOnly: boolean;
  /** 0–100, null for ONLINE */
  percentage: number | null;
  /** Seconds until earliest reservation expires (for countdown UI) */
  earliestExpiryInSeconds: number | null;
}
export type CourseStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

// ── Models ────────────────────────────────────────────────

export interface Category {
  id: string;
  name: string;
  slug: string;
  _count?: { courses: number };
  parentId?: string | null;
  parent?: Category | null;
  children?: Category[];
}

export interface Level {
  id: string;
  name: string;
  slug: string;
  order: number;
  _count?: { courses: number };
}

export type CourseTeacherRole = 'LEAD' | 'ASSISTANT' | 'GUEST';

export interface Instructor {
  id: string;
  name: string;
  email?: string;
  authId?: string; // Links to Use table if needed
  bio?: string | null;
  title?: string | null;
  nickname?: string | null;
  profileImage?: string | null;
}

/**
 * Public instructor profile — used for the Tutors listing grid.
 * Maps to Teacher model with extended fields.
 */
export interface InstructorPublic {
  id: string;
  name: string;
  nickname?: string | null;
  profileImage?: string | null;
  title?: string | null;
  bio?: string | null;
  expertise?: string | null;
  experience?: string | null;
  education?: string | null;
  educationHistory: string[];
  achievements: string[];
  quote?: string | null;
  socialLink?: string | null;
  facebookUrl?: string | null;
  instagramUrl?: string | null;
  tiktokUrl?: string | null;
  linkedinUrl?: string | null;
  _count?: { courses: number };
  // Review stats (from aggregation)
  averageRating?: number;
  totalReviews?: number;
  ratingDistribution?: { star: number; count: number }[];
  courses?: Pick<Course, 'id' | 'title' | 'slug' | 'thumbnail' | 'price' | 'courseType'>[];
}

/**
 * Full tutor profile — used for the /tutors/[id] detail page.
 * Includes all InstructorPublic fields plus aggregated reviews and student count.
 */
export interface TutorPublicProfile extends InstructorPublic {
  courses: Course[];
  recentReviews: TutorReview[];
  totalStudents: number;
}

/** A review as returned by the tutor profile endpoint */
export interface TutorReview {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  helpful: number;
  user: { name: string; profileImage?: string | null };
  course: { id: string; title: string };
}

/** Instructor พร้อม role และ order (ใช้ใน instructors[] array) */
export interface CourseInstructor extends Instructor {
  role: CourseTeacherRole;
  order: number;
}

export interface Course {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  shortDescription: string | null;
  price: number;
  originalPrice: number | null;
  status: CourseStatus;
  courseType: CourseType;

  // Thumbnails (3 sizes)
  thumbnail: string | null;
  thumbnailSm: string | null;
  thumbnailLg: string | null;
  demoVideoUrl?: string | null;
  gumletVideoId?: string | null;
  videoProvider?: 'YOUTUBE' | 'GUMLET';

  // Relations
  categoryId: string | null;
  category: Category | null;
  levelId: string | null;
  level: Level | null;
  // ผู้สอนหลัก (backward compat — ใช้สำหรับ fallback เมื่อ instructors[] ว่าง)
  instructorId: string | null;
  instructor: Instructor | null;
  // ผู้สอนทั้งหมด (รวม LEAD + ASSISTANT + GUEST)
  instructors?: CourseInstructor[];

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
  tags?: string[];
  promotionalPrice?: number | null;
  isBestSeller?: boolean;
  isRecommended?: boolean;
  accessDurationDays?: number | null;

  // Calculated fields
  rating?: number;
  reviewCount?: number;
  // promotions?: Promotion[]; // Uncomment when Promotion type is added

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
  gumletVideoId: string | null;
  videoProvider: 'YOUTUBE' | 'GUMLET';
  duration: number | null;
  isFree?: boolean;
  order: number;
  chapterId: string;
}

export interface CourseSchedule {
  id: string;
  sessionNumber?: number | null;
  date: string;
  startTime: string; // ISO String
  endTime: string; // ISO String
  topic: string;
  chapterTitle?: string | null;
  videoUrl?: string | null;
  materialUrl?: string | null;
  gumletVideoId?: string | null;
  videoProvider?: 'YOUTUBE' | 'GUMLET';
  location: string | null;
  zoomLink?: string | null;
  isOnline: boolean;
  status?: 'ON_SCHEDULE' | 'POSTPONED' | 'CANCELLED';
  courseId: string;
}

export interface Review {
  id: string;
  rating: number;
  comment: string | null;
  helpful: number;
  isHidden: boolean;
  userId: string;
  user: { id: string; name: string; profileImage?: string | null; email?: string | null };
  courseId: string;
  course?: { id: string; title: string };
  createdAt: string;
}

export interface Enrollment {
  id: string;
  userId: string;
  courseId: string;
  status: 'ACTIVE' | 'INACTIVE' | 'EXPIRED';
  expiresAt: string | null;
  isExpired?: boolean;
  createdAt: string;
  course?: Course;
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
  promotionalPrice?: number | null;
  courseType: CourseType;
  categoryId?: string | null;
  levelId?: string | null;
  instructorId?: string;
  /** ผู้สอนหลายคน: array ของ teacher IDs เรียงตาม order (ตัวแรกคือ LEAD) */
  instructorIds?: string[];
  duration?: string | null;
  videoCount?: number;
  maxSeats?: number | null;
  enrollStartDate?: string | null;
  enrollEndDate?: string | null;
  location?: string | null;
  mapUrl?: string | null;
  zoomLink?: string | null;
  published?: boolean;
  tags?: string[];
  isBestSeller?: boolean;
  isRecommended?: boolean;
  accessDurationDays?: number;
  gumletVideoId?: string | null;
  videoProvider?: 'YOUTUBE' | 'GUMLET';
}

export interface Banner {
  id: string;
  title: string;
  subtitle?: string | null;
  imageUrl: string;
  imageUrlMobile?: string | null;
  ctaLink?: string | null;
  ctaText?: string | null;
  isActive: boolean;
  priority: number;
  startDate?: string | null; // ISO String from JSON
  endDate?: string | null; // ISO String from JSON
  position: BannerPosition;
}

export type BannerPosition = 'EXPLORE_TOP' | 'EXPLORE_MIDDLE' | 'LANDING_HERO';

export interface CourseQueryParams {
  search?: string;
  status?: CourseStatus;
  courseType?: CourseType | null;
  categoryId?: string;
  levelId?: string;
  tutorId?: string;
  minPrice?: number | null;
  maxPrice?: number | null;
  rating?: number;
  published?: boolean;
  page?: number;
  limit?: number;
  sort?: 'newest' | 'price-asc' | 'price-desc' | 'popular';
  /** กรองคอร์สที่เต็มออก — ใช้สำหรับหน้าแรก */
  excludeFull?: boolean;
}

export interface ReviewQueryParams {
  courseId: string;
  rating?: number;
  page?: number;
  limit?: number;
  sort?: 'createdAt' | 'rating' | 'helpful';
  order?: 'asc' | 'desc';
}

// ── Admin Dashboard ─────────────────────────────────────

export interface AdminDashboardFilters {
  startDate?: string;
  endDate?: string;
  courseId?: string;
  tutorId?: string;
}

export interface AdminDashboardTotals {
  courses: number;
  students: number;
  revenue: number;
  enrollments: number;
}

export interface AdminDashboardDailyPoint {
  date: string; // YYYY-MM-DD
  revenue: number;
  enrollments: number;
}

export interface AdminDashboardTopCourse {
  courseId: string;
  courseTitle: string;
  revenue: number;
}

export interface AdminDashboardPaymentStatusPoint {
  status: string;
  count: number;
}

export interface AdminDashboardNewStudentsPoint {
  date: string; // YYYY-MM-DD
  count: number;
}

export interface AdminDashboardTutorSummary {
  tutorId: string;
  name: string;
  profileImage: string | null;
  courseCount: number;
  revenue: number;
  studentCount: number;
  avgRating: number;
}

export interface AdminDashboardMonthlyMetricPoint {
  month: string; // YYYY-MM
  value: number;
}

export interface AdminDashboardRatingBucket {
  rating: number;
  count: number;
}

export interface AdminDashboardTopRatedCourse {
  courseId: string;
  courseTitle: string;
  avgRating: number;
  reviewCount: number;
}

export interface AdminDashboardStats {
  totals: AdminDashboardTotals;
  daily: AdminDashboardDailyPoint[];
  topCoursesByRevenue?: AdminDashboardTopCourse[];
  paymentStatus?: AdminDashboardPaymentStatusPoint[];
  newStudentsDaily?: AdminDashboardNewStudentsPoint[];
  monthlyRevenue?: AdminDashboardMonthlyMetricPoint[];
  monthlyNewStudents?: AdminDashboardMonthlyMetricPoint[];
  monthlyNewCourses?: AdminDashboardMonthlyMetricPoint[];
  ratingDistribution?: AdminDashboardRatingBucket[];
  topRatedCourses?: AdminDashboardTopRatedCourse[];
  tutors?: AdminDashboardTutorSummary[];
}
