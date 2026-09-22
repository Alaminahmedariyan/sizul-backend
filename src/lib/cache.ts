import { redis } from "./redis";

const DEFAULT_TTL_SECONDS = 60;

/**
 * Get a value from Redis cache, or compute and store it.
 *
 * When Redis is unavailable (REDIS_URL not configured, or the client
 * failed to initialize), the fetcher is called directly — caching
 * becomes a no-op so the request still succeeds.
 */
export const getOrSetCache = async <T>(
	key: string,
	fetcher: () => Promise<T>,
	ttlSeconds: number = DEFAULT_TTL_SECONDS,
): Promise<T> => {
	// Redis not configured — bypass cache entirely
	if (!redis) {
		return fetcher();
	}

	try {
		const cached = await redis.get(key);
		if (cached) {
			return JSON.parse(cached) as T;
		}
	} catch (error) {
		console.error(`[Cache] Failed to read key "${key}":`, error);
	}

	const fresh = await fetcher();

	try {
		await redis.set(key, JSON.stringify(fresh), "EX", ttlSeconds);
	} catch (error) {
		console.error(`[Cache] Failed to write key "${key}":`, error);
	}

	return fresh;
};

/**
 * Delete a single cache key.
 * No-op when Redis is unavailable.
 */
export const invalidateCache = async (key: string): Promise<void> => {
	if (!redis) {
		return;
	}

	try {
		await redis.del(key);
	} catch (error) {
		console.error(`[Cache] Failed to invalidate key "${key}":`, error);
	}
};

/**
 * Delete every key matching a pattern (e.g. "user:*").
 * Uses SCAN to avoid blocking Redis with a full KEYS lookup.
 * No-op when Redis is unavailable.
 */
export const invalidateCachePattern = async (
	pattern: string,
): Promise<void> => {
	if (!redis) {
		return;
	}

	try {
		let cursor = "0";
		do {
			const [nextCursor, keys] = await redis.scan(
				cursor,
				"MATCH",
				pattern,
				"COUNT",
				100,
			);
			cursor = nextCursor;

			if (keys.length > 0) {
				await redis.del(...keys);
			}
		} while (cursor !== "0");
	} catch (error) {
		console.error(
			`[Cache] Failed to invalidate pattern "${pattern}":`,
			error,
		);
	}
};