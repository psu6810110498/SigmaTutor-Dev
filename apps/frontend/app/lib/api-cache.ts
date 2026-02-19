// ============================================================
// API Cache — Request deduplication & caching
// ============================================================

interface CacheEntry<T> {
    data: T;
    timestamp: number;
    expiresAt: number;
}

class ApiCache {
    private cache = new Map<string, CacheEntry<any>>();
    private pendingRequests = new Map<string, Promise<any>>();
    private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

    /**
     * Get cached data or fetch if not cached
     * Prevents duplicate requests for the same endpoint
     */
    async get<T>(
        key: string,
        fetcher: () => Promise<T>,
        ttl: number = this.DEFAULT_TTL
    ): Promise<T> {
        const now = Date.now();
        const cached = this.cache.get(key);

        // Return cached data if still valid
        if (cached && now < cached.expiresAt) {
            return cached.data as T;
        }

        // If request is already pending, return the pending promise
        if (this.pendingRequests.has(key)) {
            return this.pendingRequests.get(key)! as Promise<T>;
        }

        // Create new request
        const promise = fetcher()
            .then((data) => {
                // Cache the result
                this.cache.set(key, {
                    data,
                    timestamp: now,
                    expiresAt: now + ttl,
                });
                // Remove from pending
                this.pendingRequests.delete(key);
                return data;
            })
            .catch((error) => {
                // Remove from pending on error
                this.pendingRequests.delete(key);
                throw error;
            });

        this.pendingRequests.set(key, promise);
        return promise;
    }

    /**
     * Clear cache for a specific key
     */
    clear(key: string): void {
        this.cache.delete(key);
    }

    /**
     * Clear all cache
     */
    clearAll(): void {
        this.cache.clear();
        this.pendingRequests.clear();
    }

    /**
     * Clean expired entries
     */
    cleanExpired(): void {
        const now = Date.now();
        for (const [key, entry] of this.cache.entries()) {
            if (now >= entry.expiresAt) {
                this.cache.delete(key);
            }
        }
    }
}

export const apiCache = new ApiCache();

// Clean expired entries every 10 minutes
if (typeof window !== 'undefined') {
    setInterval(() => {
        apiCache.cleanExpired();
    }, 10 * 60 * 1000);
}
