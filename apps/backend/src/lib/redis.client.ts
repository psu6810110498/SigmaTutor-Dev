/**
 * Redis Client Service
 *
 * Responsibilities:
 *  - Create and manage a singleton ioredis connection
 *  - Gracefully handle connection failures (fallback to in-memory when Redis is unavailable)
 *  - Expose a typed client for use across the application
 *
 */

import Redis from 'ioredis';

const REDIS_URL = process.env.REDIS_URL ?? 'redis://localhost:6379';

let redisClient: Redis | null = null;

/**
 * Returns a connected Redis client.
 * Creates the singleton instance on first call.
 * Returns null if Redis is unreachable (graceful degradation).
 */
export function getRedisClient(): Redis | null {
    if (redisClient) return redisClient;

    try {
        const client = new Redis(REDIS_URL, {
            maxRetriesPerRequest: 1,
            enableReadyCheck: false,
            lazyConnect: true,
        });

        client.on('connect', () => {
            console.log('✅ Redis connected:', REDIS_URL);
        });

        client.on('error', (err: Error) => {
            console.warn('⚠️  Redis error (rate limiting falls back to in-memory):', err.message);
            redisClient = null; // reset so next call retries
        });

        redisClient = client;
        return client;
    } catch (err) {
        console.warn('⚠️  Failed to initialise Redis client:', (err as Error).message);
        return null;
    }
}

/**
 * Gracefully close the Redis connection.
 * Call this during application shutdown.
 */
export async function closeRedisClient(): Promise<void> {
    if (redisClient) {
        await redisClient.quit();
        redisClient = null;
        console.log('🔌 Redis connection closed');
    }
}
