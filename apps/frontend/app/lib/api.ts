// ============================================================
// API Helper — HTTP client for backend communication
// Base URL: NEXT_PUBLIC_API_URL (default: http://localhost:4000/api)
// ============================================================

import type {
  TutorPublicProfile,
  InstructorPublic,
  ApiResponse,
  Course,
  CourseListResponse,
  CourseAvailability,
  CreateCourseInput,
  CourseQueryParams,
  Category,
  Level,
  ReviewListResponse,
  ReviewQueryParams,
  Banner,
  BannerPosition,
  AdminDashboardStats,
  AdminDashboardFilters,
} from './types';

// ── Config ────────────────────────────────────────────────

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

// ── Core HTTP Methods ─────────────────────────────────────

/** Build headers */
function headers(_auth?: boolean): HeadersInit {
  return { 'Content-Type': 'application/json' };
}

/** Generic fetch wrapper with error handling */
async function request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      credentials: 'include', // ✅ Send cookies with every request
    });

    let json;
    try {
      json = await res.json();
    } catch {
      json = {}; // Handle empty responses (like 204)
    }

    if (!res.ok) {
      // ✅ Handle 401 Unauthorized (Cookie expired/missing)
      if (res.status === 401 && typeof window !== 'undefined' && !endpoint.includes('/auth/me')) {
        // Optional: Trigger global logout or redirect
        // window.location.href = '/login';
      }

      return {
        success: false,
        error: json.error || `HTTP ${res.status}`,
        details: json.details,
      };
    }

    return json;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}

// ============================================================
// Course API
// ============================================================

// Categories
export const fetchCategories = async () => {
  return request<Category[]>('/categories');
};

// Levels
export const fetchLevels = async () => {
  return request<Level[]>('/levels');
};

export const fetchCourses = async () => {
  return request<CourseListResponse>('/courses');
};

export const courseApi = {
  /**
   * GET /courses/marketplace — Public listing for Explore page
   * Supports: search, category, level, price, rating, sort
   */
  getMarketplace(params?: CourseQueryParams, options?: RequestInit) {
    const query = params
      ? '?' +
        new URLSearchParams(
          Object.entries(params)
            .filter(([, v]) => v !== undefined && v !== null && v !== '')
            .map(([k, v]) => [k, String(v)])
        ).toString()
      : '';

    return request<CourseListResponse>(`/courses/marketplace${query}`, options);
  },

  /** GET /courses/enrolled — User's enrolled courses */
  getEnrolled() {
    return request<Course[]>(`/courses/enrolled`);
  },

  /** GET /courses/my-schedules — User's daily timetable schedules */
  getUpcomingSchedules() {
    return request<any>(`/courses/my-schedules`);
  },

  /** GET /courses/enrolled-vod — User's enrolled VOD courses with chapters/lessons */
  getEnrolledVod() {
    return request<any>(`/courses/enrolled-vod`);
  },

  /** POST /courses/self-study — Create a self-study session */
  createSelfStudy(data: { courseId: string; lessonId?: string; topic: string; startTime: string; endTime: string }) {
    return request<any>('/courses/self-study', {
      method: 'POST',
      headers: headers(true),
      body: JSON.stringify(data),
    });
  },

  /** DELETE /courses/self-study/:id — Delete a self-study session */
  deleteSelfStudy(id: string) {
    return request<void>(`/courses/self-study/${id}`, {
      method: 'DELETE',
      headers: headers(true),
    });
  },

  /** GET /courses/self-study — Get all self-study sessions (for calendar) */
  getAllSelfStudy() {
    return request<any>(`/courses/self-study`);
  },

  /** PUT /courses/self-study/:id — Update a self-study session */
  updateSelfStudy(id: string, data: { topic?: string; startTime?: string; endTime?: string; lessonId?: string }) {
    return request<any>(`/courses/self-study/${id}`, {
      method: 'PUT',
      headers: headers(true),
      body: JSON.stringify(data),
    });
  },

  /** GET /courses/admin — Admin/Instructor dashboard listing */
  getAdmin(params?: any) {
    const query = params
      ? '?' +
        new URLSearchParams(
          Object.entries(params)
            .filter(([, v]) => v !== undefined && v !== '')
            .map(([k, v]) => [k, String(v)])
        ).toString()
      : '';
    return request<any>(`/courses/admin${query}`);
  },

  /** Legacy List (mapped to marketplace or general query if needed) */
  list(params?: CourseQueryParams) {
    return this.getMarketplace(params);
  },

  /** GET /courses/:id — Single course detail */
  getById(id: string) {
    return request<Course>(`/courses/${id}`);
  },

  /** GET /courses/slug/:slug — By SEO-friendly slug */
  getBySlug(slug: string) {
    return request<Course>(`/courses/slug/${slug}`);
  },

  /** POST /courses — Create (ADMIN) */
  create(data: CreateCourseInput) {
    // Sanitize data: Convert empty strings to null for optional fields
    const sanitizedData = { ...data };
    (Object.keys(sanitizedData) as (keyof CreateCourseInput)[]).forEach((key) => {
      if (sanitizedData[key] === '') {
        // @ts-ignore
        sanitizedData[key] = null;
      }
    });

    return request<Course>('/courses', {
      method: 'POST',
      headers: headers(true),
      body: JSON.stringify(sanitizedData),
    });
  },

  /** PUT /courses/:id — Update (ADMIN) */
  update(id: string, data: Partial<CreateCourseInput>) {
    // Sanitize data
    const sanitizedData = { ...data };
    (Object.keys(sanitizedData) as (keyof CreateCourseInput)[]).forEach((key) => {
      if (sanitizedData[key] === '') {
        // @ts-ignore
        sanitizedData[key] = null;
      }
    });

    return request<Course>(`/courses/${id}`, {
      method: 'PUT',
      headers: headers(true),
      body: JSON.stringify(sanitizedData),
    });
  },

  /** PATCH /courses/:id/status — Update status (ADMIN) */
  updateStatus(id: string, status: string) {
    return request<Course>(`/courses/${id}/status`, {
      method: 'PATCH',
      headers: headers(true),
      body: JSON.stringify({ status }),
    });
  },

  /** PATCH /courses/:id/publish — Toggle published (ADMIN) */
  togglePublish(id: string, published: boolean) {
    return request<Course>(`/courses/${id}/publish`, {
      method: 'PATCH',
      headers: headers(true),
      body: JSON.stringify({ published }),
    });
  },

  /** DELETE /courses/:id — Soft delete (ADMIN) */
  delete(id: string) {
    return request<void>(`/courses/${id}`, {
      method: 'DELETE',
      headers: headers(true),
    });
  },

  /** POST /courses/:id/upload — Upload thumbnail (ADMIN) */
  async uploadThumbnail(id: string, file: File) {
    const formData = new FormData();
    formData.append('thumbnail', file);

    const res = await fetch(`${API_BASE}/courses/${id}/upload`, {
      method: 'POST',
      body: formData,
      credentials: 'include',
    });

    return res.json();
  },
};

// ============================================================
// Tutor API
// ============================================================

export type TutorFilterParams = {
  categoryId?: string | null;
  levelId?: string | null;
  courseType?: string | null;
  minPrice?: string | number | null;
  maxPrice?: string | number | null;
  search?: string;
};

export type TutorProfile = {
  id: string;
  name: string;
  nickname?: string | null;
  profileImage?: string | null;
  title?: string | null;
};



export const tutorApi = {
  /**
   * GET /tutors — Returns instructors filtered by active course filters.
   * All params are optional; omitting all returns every instructor with a published course.
   */
  getFiltered(params?: TutorFilterParams): Promise<ApiResponse<TutorProfile[]>> {
    const entries = Object.entries(params ?? {}).filter(
      ([, v]) => v !== undefined && v !== null && v !== ''
    );
    const query =
      entries.length > 0
        ? '?' + new URLSearchParams(entries.map(([k, v]) => [k, String(v)])).toString()
        : '';
    return request<TutorProfile[]>(`/tutors${query}`);
  },

  /** 
   * GET /tutors/all — Full list for the Instructors/Tutors Grid Page
   * Cached at Edge/CDN for performance.
   */
  getAll(): Promise<ApiResponse<InstructorPublic[]>> {
    // Revalidate every 1 hour (3600 seconds) for ISR
    return request<InstructorPublic[]>('/tutors/all', {
      next: { revalidate: 3600 },
    } as RequestInit);
  },

  /** 
   * GET /tutors/:id — Full Instructor Profile including review stats
   * Cached at Edge/CDN for performance.
   */
  getById(id: string): Promise<ApiResponse<TutorPublicProfile>> {
    return request<TutorPublicProfile>(`/tutors/${id}`, {
      next: { revalidate: 3600 },
    } as RequestInit);
  },
};

// ============================================================
// Admin Dashboard API
// ============================================================

export const dashboardApi = {
  /** GET /dashboard/admin/stats — High-level metrics for admin dashboard */
  getAdminStats(filters?: AdminDashboardFilters) {
    const query = filters
      ? '?' +
        new URLSearchParams(
          Object.entries(filters)
            .filter(([, v]) => v !== undefined && v !== '')
            .map(([k, v]) => [k, String(v)])
        ).toString()
      : '';
    return request<AdminDashboardStats>(`/dashboard/admin/stats${query}`);
  },
};

// ============================================================
// Banner API
// ============================================================

export const bannerApi = {
  getActive(position: 'EXPLORE_TOP' | 'EXPLORE_MIDDLE' | 'LANDING_HERO' = 'EXPLORE_TOP') {
    // Cache banners via Next.js fetch options (Revalidate every 5 minutes if fetched on server)
    return request<Banner[]>(`/banners/active?position=${position}`, {
      next: { revalidate: 300 },
    } as RequestInit);
  },

  /** GET /banners — Admin List */
  getAll() {
    return request<Banner[]>('/banners');
  },

  /** GET /banners/trash — Admin List Trashed */
  getTrash() {
    return request<Banner[]>('/banners/trash', { headers: headers(true) });
  },

  /** POST /banners — Create */
  create(data: Partial<Banner>) {
    return request<Banner>('/banners', {
      method: 'POST',
      body: JSON.stringify(data),
      headers: headers(true),
    });
  },

  /** PUT /banners/:id — Update */
  update(id: string, data: Partial<Banner>) {
    return request<Banner>(`/banners/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
      headers: headers(true),
    });
  },

  /** DELETE /banners/:id — Soft Delete */
  delete(id: string) {
    return request<void>(`/banners/${id}`, {
      method: 'DELETE',
      headers: headers(true),
    });
  },

  /** PUT /banners/:id/restore — Restore */
  restore(id: string) {
    return request<void>(`/banners/${id}/restore`, {
      method: 'PUT',
      headers: headers(true),
    });
  },

  /** DELETE /banners/:id/force — Force Delete */
  forceDelete(id: string) {
    return request<void>(`/banners/${id}/force`, {
      method: 'DELETE',
      headers: headers(true),
    });
  },
};

// ============================================================
// Coupon API
// ============================================================

export const couponApi = {
  /** GET /coupons — Admin List */
  list() {
    return request<any>('/coupons', { headers: headers(true) });
  },

  /** GET /coupons/trash — Admin List Trashed */
  getTrash() {
    return request<any>('/coupons/trash', { headers: headers(true) });
  },

  /** POST /coupons — Create */
  create(data: any) {
    return request<any>('/coupons', {
      method: 'POST',
      body: JSON.stringify(data),
      headers: headers(true),
    });
  },

  /** PUT /coupons/:id — Update */
  update(id: string, data: any) {
    return request<any>(`/coupons/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
      headers: headers(true),
    });
  },

  /** DELETE /coupons/:id — Soft Delete */
  delete(id: string) {
    return request<any>(`/coupons/${id}`, {
      method: 'DELETE',
      headers: headers(true),
    });
  },

  /** PUT /coupons/:id/restore — Restore */
  restore(id: string) {
    return request<any>(`/coupons/${id}/restore`, {
      method: 'PUT',
      headers: headers(true),
    });
  },

  /** DELETE /coupons/:id/force — Force Delete */
  forceDelete(id: string) {
    return request<any>(`/coupons/${id}/force`, {
      method: 'DELETE',
      headers: headers(true),
    });
  },

  /** POST /coupons/validate — Public */
  validate(code: string, courseIds: string[]) {
    return request<any>('/coupons/validate', {
      method: 'POST',
      body: JSON.stringify({ code, courseIds }),
      headers: headers(),
    });
  },
};

// ============================================================
// Category API
// ============================================================
export const categoryApi = {
  /** GET /categories — List all (for dropdowns) */
  list() {
    return request<Category[]>('/categories', { next: { revalidate: 600 } } as RequestInit); // Cache 10 minutes
  },

  /** POST /categories — Create (ADMIN) */
  create(data: { name: string; slug: string }) {
    return request<Category>('/categories', {
      method: 'POST',
      headers: headers(true),
      body: JSON.stringify(data),
    });
  },

  /** PUT /categories/:id — Update (ADMIN) */
  update(id: string, data: { name: string; slug: string }) {
    return request<Category>(`/categories/${id}`, {
      method: 'PUT',
      headers: headers(true),
      body: JSON.stringify(data),
    });
  },

  /** DELETE /categories/:id — Delete (ADMIN) */
  delete(id: string) {
    return request<void>(`/categories/${id}`, {
      method: 'DELETE',
      headers: headers(true),
    });
  },
};

// ============================================================
// User API (for instructor selection)
// ============================================================

export const userApi = {
  /** GET /users/instructors — List instructors with stats (ADMIN) */
  list() {
    return request<any[]>('/users/instructors', {
      headers: headers(true),
    });
  },

  /** PATCH /users/:id — Update user profile (name, profileImage) */
  update(id: string, data: { name?: string; profileImage?: string }) {
    return request<{ id: string; name: string; email: string; profileImage?: string }>(
      `/users/${id}`,
      {
        method: 'PATCH',
        headers: headers(true),
        body: JSON.stringify(data),
      }
    );
  },
};

// ============================================================
// Level API
// ============================================================
export const levelApi = {
  /** GET /levels — List all (ordered) */
  list() {
    return request<Level[]>('/levels', { next: { revalidate: 600 } } as RequestInit); // Cache 10 minutes
  },

  /** POST /levels — Create (ADMIN) */
  create(data: { name: string; slug: string; order?: number }) {
    return request<Level>('/levels', {
      method: 'POST',
      headers: headers(true),
      body: JSON.stringify(data),
    });
  },

  /** PUT /levels/:id — Update (ADMIN) */
  update(id: string, data: { name: string; slug: string; order?: number }) {
    return request<Level>(`/levels/${id}`, {
      method: 'PUT',
      headers: headers(true),
      body: JSON.stringify(data),
    });
  },

  /** DELETE /levels/:id — Delete (ADMIN) */
  delete(id: string) {
    return request<void>(`/levels/${id}`, {
      method: 'DELETE',
      headers: headers(true),
    });
  },
};

// ============================================================
// Review API
// ============================================================

export const reviewApi = {
  /** GET /reviews?courseId=xxx — Paginated with stats */
  list(params: ReviewQueryParams) {
    const query =
      '?' +
      new URLSearchParams(
        Object.entries(params)
          .filter(([, v]) => v !== undefined)
          .map(([k, v]) => [k, String(v)])
      ).toString();

    return request<ReviewListResponse>(`/reviews${query}`);
  },

  /** POST /reviews — Create review (authenticated) */
  create(data: { courseId: string; rating: number; comment?: string }) {
    return request<Review>('/reviews', {
      method: 'POST',
      headers: headers(true),
      body: JSON.stringify(data),
    });
  },

  /** PUT /reviews/:id — Update own review */
  update(id: string, data: { rating: number; comment?: string }) {
    return request<Review>(`/reviews/${id}`, {
      method: 'PUT',
      headers: headers(true),
      body: JSON.stringify(data),
    });
  },

  /** PATCH /reviews/:id/helpful — Mark helpful (+1) */
  markHelpful(id: string) {
    return request<Review>(`/reviews/${id}/helpful`, {
      method: 'PATCH',
    });
  },

  /** DELETE /reviews/:id — Delete own review */
  delete(id: string) {
    return request<void>(`/reviews/${id}`, {
      method: 'DELETE',
      headers: headers(true),
    });
  },

  /** GET /reviews/admin/courses — Admin: Get courses with review aggregate stats */
  adminCourseList() {
    return request<
      {
        id: string;
        title: string;
        slug: string;
        thumbnail?: string | null;
        totalReviews: number;
        averageRating: number;
      }[]
    >('/reviews/admin/courses', { headers: headers(true) });
  },

  /** GET /reviews/admin — Admin: Get all reviews */
  adminList(params: {
    page?: number;
    limit?: number;
    courseId?: string;
    sort?: 'latest' | 'oldest' | 'highest' | 'lowest';
  }) {
    const query =
      '?' +
      new URLSearchParams(
        Object.entries(params)
          .filter(([, v]) => v !== undefined)
          .map(([k, v]) => [k, String(v)])
      ).toString();

    return request<{ reviews: Review[]; pagination: any }>(`/reviews/admin${query}`, {
      headers: headers(true),
    });
  },

  /** PATCH /reviews/admin/:id/toggle-visibility */
  toggleVisibility(id: string) {
    return request<Review>(`/reviews/admin/${id}/toggle-visibility`, {
      method: 'PATCH',
      headers: headers(true),
    });
  },
};

// Re-export for convenience
import type { Review, Chapter, Lesson, CourseSchedule } from './types';

// ── Chapter API ──────────────────────────────────────────

export const chapterApi = {
  create: async (data: { courseId: string; title: string; order?: number }) => {
    return request<ApiResponse<Chapter>>('/chapters', {
      method: 'POST',
      body: JSON.stringify(data),
      headers: headers(true),
    });
  },

  update: async (id: string, data: Partial<Chapter>) => {
    return request<ApiResponse<Chapter>>(`/chapters/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
      headers: headers(true),
    });
  },

  delete: async (id: string) => {
    return request<void>(`/chapters/${id}`, {
      method: 'DELETE',
      headers: headers(true),
    });
  },

  reorder: async (orders: { id: string; order: number }[]) => {
    return request<void>('/chapters/reorder', {
      method: 'PUT',
      body: JSON.stringify({ orders }),
      headers: headers(true),
    });
  },
};

// ── Lesson API ───────────────────────────────────────────

export const lessonApi = {
  create: async (data: {
    chapterId: string;
    title: string;
    type?: 'VIDEO' | 'FILE' | 'QUIZ';
    content?: string | null;
    youtubeUrl?: string | null;
    gumletVideoId?: string | null;
    videoProvider?: 'YOUTUBE' | 'GUMLET';
    duration?: number;
    order?: number;
  }) => {
    return request<ApiResponse<Lesson>>('/lessons', {
      method: 'POST',
      body: JSON.stringify(data),
      headers: headers(true),
    });
  },

  update: async (id: string, data: Partial<Lesson>) => {
    return request<ApiResponse<Lesson>>(`/lessons/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
      headers: headers(true),
    });
  },

  delete: async (id: string) => {
    return request<void>(`/lessons/${id}`, {
      method: 'DELETE',
      headers: headers(true),
    });
  },

  reorder: async (orders: { id: string; order: number }[]) => {
    return request<void>('/lessons/reorder', {
      method: 'PUT',
      body: JSON.stringify({ orders }),
      headers: headers(true),
    });
  },
};

// ── Schedule API ─────────────────────────────────────────

// ── Schedule API ─────────────────────────────────────────

export const scheduleApi = {
  create: async (
    data: Partial<CourseSchedule> & {
      courseId: string;
      startTime: string;
      endTime: string;
      date: string;
      topic: string;
    }
  ) => {
    return request<ApiResponse<CourseSchedule>>('/schedules', {
      method: 'POST',
      body: JSON.stringify(data),
      headers: headers(true),
    });
  },

  // Sync multiple sessions for a course in one request
  sync: async (courseId: string, sessions: Partial<CourseSchedule>[]) => {
    return request<ApiResponse<CourseSchedule[]>>(`/schedules/sync/${courseId}`, {
      method: 'PUT',
      body: JSON.stringify({ sessions }),
      headers: headers(true),
    });
  },

  update: async (id: string, data: Partial<CourseSchedule>) => {
    return request<ApiResponse<CourseSchedule>>(`/schedules/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
      headers: headers(true),
    });
  },

  delete: async (id: string) => {
    return request<void>(`/schedules/${id}`, {
      method: 'DELETE',
      headers: headers(true),
    });
  },
};

// ============================================================
// Upload API
// ============================================================

export const uploadApi = {
  /** POST /upload/image — Generic Image Upload */
  async uploadImage(file: File) {
    const formData = new FormData();
    formData.append('image', file);

    const res = await fetch(`${API_BASE}/upload/image`, {
      method: 'POST',
      body: formData,
      // Note: Content-Type is set automatically for FormData
    });

    const json = await res.json();

    if (!res.ok) {
      throw new Error(json.message || 'Upload failed');
    }

    return json as { success: boolean; url: string };
  },
};

// ============================================================
// Site Content API (Homepage sections)
// ============================================================

export const siteContentApi = {
  /** GET /site-content — All sections (public) */
  getAll() {
    return request<Record<string, unknown>>('/site-content');
  },

  /** GET /site-content/:key — Single section (public) */
  getSection(key: string) {
    return request<unknown>(`/site-content/${key}`);
  },

  /** PUT /site-content/:key — Update section (ADMIN) */
  updateSection(key: string, data: unknown) {
    return request<unknown>(`/site-content/${key}`, {
      method: 'PUT',
      headers: headers(true),
      body: JSON.stringify(data),
    });
  },
};

// ============================================================
// Progress API
// ============================================================

export const progressApi = {
  /** GET /progress/:courseId - Fetch all completed items for a user in a specific course */
  getCourseProgress: (courseId: string) =>
    request<{ id: string; lessonId?: string; scheduleId?: string; isCompleted: boolean }[]>(
      `/progress/${courseId}`
    ),

  /** POST /progress/toggle - Toggle the completion status of a lesson/schedule */
  toggleProgress: (courseId: string, data: { lessonId?: string; scheduleId?: string }) =>
    request<any>('/progress/toggle', {
      method: 'POST',
      body: JSON.stringify({ courseId, ...data }),
      headers: headers(true),
    }),
};

// ============================================================
// Seat Availability API
// ============================================================

export const availabilityApi = {
  /** GET /courses/:id/availability — real-time seat data */
  get: (courseId: string) =>
    request<CourseAvailability>(`/courses/${courseId}/availability`),

  /** Fetch availability for multiple courses in parallel */
  getMany: (courseIds: string[]) =>
    Promise.all(courseIds.map((id) => availabilityApi.get(id))),

  /** POST /courses/notify-seat — subscribe to seat-available notification */
  notifyWhenAvailable: (courseId: string, email: string) =>
    request<{ message: string }>('/courses/notify-seat', {
      method: 'POST',
      body: JSON.stringify({ courseId, email }),
    }),
};

// ============================================================
// Gumlet API
// ============================================================
export const gumletApi = {
  /** POST /gumlet/upload-url — Get signed upload URL (ADMIN) */
  getUploadUrl() {
    return request<{ upload_url: string; asset_id: string }>('/gumlet/upload-url', {
      method: 'POST',
      headers: headers(true),
    });
  },
};
