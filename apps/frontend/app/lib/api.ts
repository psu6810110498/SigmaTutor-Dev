// ============================================================
// API Helper — HTTP client for backend communication
// Base URL: NEXT_PUBLIC_API_URL (default: http://localhost:4000/api)
// ============================================================

import type {
    ApiResponse,
    Course,
    CourseListResponse,
    CreateCourseInput,
    CourseQueryParams,
    Category,
    Level,
    ReviewListResponse,
    ReviewQueryParams,
    Banner,
    BannerPosition,
} from './types';

// ── Config ────────────────────────────────────────────────

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

// ── Core HTTP Methods ─────────────────────────────────────

/** Build headers */
function headers(_auth?: boolean): HeadersInit {
    return { 'Content-Type': 'application/json' };
}

/** Generic fetch wrapper with error handling */
async function request<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<ApiResponse<T>> {
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
    getMarketplace(params?: CourseQueryParams) {
        const query = params ? '?' + new URLSearchParams(
            Object.entries(params)
                .filter(([, v]) => v !== undefined && v !== null && v !== '')
                .map(([k, v]) => [k, String(v)])
        ).toString() : '';

        // Cache for 2 minutes (courses may change frequently)
        return request<CourseListResponse>(`/courses/marketplace${query}`, {}, true, 2 * 60 * 1000);
    },

    /** GET /courses/enrolled — User's enrolled courses */
    getEnrolled() {
        return request<Course[]>(`/courses/enrolled`);
    },

    /** GET /courses/admin — Admin/Instructor dashboard listing */
    getAdmin(params?: any) {
        const query = params ? '?' + new URLSearchParams(
            Object.entries(params)
                .filter(([, v]) => v !== undefined && v !== '')
                .map(([k, v]) => [k, String(v)])
        ).toString() : '';
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
        (Object.keys(sanitizedData) as (keyof CreateCourseInput)[]).forEach(key => {
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
        (Object.keys(sanitizedData) as (keyof CreateCourseInput)[]).forEach(key => {
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
// Banner API
// ============================================================

export const bannerApi = {
    /** GET /banners/active — For Homepage Slider */
    getActive(position: BannerPosition = 'EXPLORE_TOP') {
        // Cache banners for 5 minutes
        return request<Banner[]>(`/banners/active?position=${position}`, {}, true, 5 * 60 * 1000);
    },

    /** GET /banners — Admin List */
    getAll() {
        return request<Banner[]>('/banners');
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

    /** DELETE /banners/:id — Delete */
    delete(id: string) {
        return request<void>(`/banners/${id}`, {
            method: 'DELETE',
            headers: headers(true),
        });
    },
};

// ============================================================
// Category API
// ============================================================

export const categoryApi = {
    /** GET /categories — List all (for dropdowns) */
    list() {
        return request<Category[]>('/categories', {}, true, 10 * 60 * 1000); // Cache 10 minutes
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
    /** GET /users — List all users (ADMIN) */
    list() {
        return request<any[]>('/users', {
            headers: headers(true),
        });
    },
};

// ============================================================
// Level API
// ============================================================

export const levelApi = {
    /** GET /levels — List all (ordered) */
    list() {
        return request<Level[]>('/levels', {}, true, 10 * 60 * 1000); // Cache 10 minutes
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
        const query = '?' + new URLSearchParams(
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
    create: async (data: Partial<CourseSchedule> & { courseId: string; startTime: string; endTime: string; date: string; topic: string }) => {
        return request<ApiResponse<CourseSchedule>>('/schedules', {
            method: 'POST',
            body: JSON.stringify(data),
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

