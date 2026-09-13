import { redis } from "./radis";


const DEFAULT_TTL_SECONDS = 60;

export const getOrSetCache = async <T>(
	key: string,
	fetcher: () => Promise<T>,
	ttlSeconds: number = DEFAULT_TTL_SECONDS,
): Promise<T> => {
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

export const invalidateCache = async (key: string): Promise<void> => {
	try {
		await redis.del(key);
	} catch (error) {
		console.error(`[Cache] Failed to invalidate key "${key}":`, error);
	}
};

