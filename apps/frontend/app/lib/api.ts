// ============================================================
// API Helper — HTTP client for backend communication
// Base URL: NEXT_PUBLIC_API_URL (default: http://localhost:4000/api/v1)
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
} from './types';

// ── Config ────────────────────────────────────────────────

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

// ── Core HTTP Methods ─────────────────────────────────────

/** Get auth token from localStorage */
function getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('sigma_token');
}

/** Build headers with optional auth */
function headers(withAuth = false): HeadersInit {
    const h: HeadersInit = { 'Content-Type': 'application/json' };
    if (withAuth) {
        const token = getToken();
        if (token) h['Authorization'] = `Bearer ${token}`;
    }
    return h;
}

/** Generic fetch wrapper with error handling */
async function request<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<ApiResponse<T>> {
    try {
        const res = await fetch(`${API_BASE}${endpoint}`, options);
        const json = await res.json();

        if (!res.ok) {
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

export const courseApi = {
    /** GET /courses — List with filters + pagination */
    list(params?: CourseQueryParams) {
        const query = params ? '?' + new URLSearchParams(
            Object.entries(params)
                .filter(([, v]) => v !== undefined && v !== '')
                .map(([k, v]) => [k, String(v)])
        ).toString() : '';

        return request<CourseListResponse>(`/courses${query}`);
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
        return request<Course>('/courses', {
            method: 'POST',
            headers: headers(true),
            body: JSON.stringify(data),
        });
    },

    /** PUT /courses/:id — Update (ADMIN) */
    update(id: string, data: Partial<CreateCourseInput>) {
        return request<Course>(`/courses/${id}`, {
            method: 'PUT',
            headers: headers(true),
            body: JSON.stringify(data),
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

        const token = getToken();
        const res = await fetch(`${API_BASE}/courses/${id}/upload`, {
            method: 'POST',
            headers: token ? { Authorization: `Bearer ${token}` } : {},
            body: formData,
        });

        return res.json();
    },
};

// ============================================================
// Category API
// ============================================================

export const categoryApi = {
    /** GET /categories — List all (for dropdowns) */
    list() {
        return request<Category[]>('/categories');
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
// Level API
// ============================================================

export const levelApi = {
    /** GET /levels — List all (ordered) */
    list() {
        return request<Level[]>('/levels');
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
