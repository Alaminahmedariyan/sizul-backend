import { redis } from "../../lib/radis";


const MAX_ATTEMPTS = 5;
const LOCKOUT_SECONDS = 15 * 60;
const ATTEMPT_WINDOW_SECONDS = 15 * 60;

const attemptsKey = (identifier: string) => `login:attempts:${identifier}`;
const lockKey = (identifier: string) => `login:locked:${identifier}`;

export const isLocked = async (identifier: string): Promise<boolean> => {
	const locked = await redis.get(lockKey(identifier));
	return Boolean(locked);
};

export const recordFailedAttempt = async (identifier: string) => {
	const key = attemptsKey(identifier);
	const attempts = await redis.incr(key);

	if (attempts === 1) {
		await redis.expire(key, ATTEMPT_WINDOW_SECONDS);
	}

	if (attempts >= MAX_ATTEMPTS) {
		await redis.set(lockKey(identifier), "1", "EX", LOCKOUT_SECONDS);
		await redis.del(key);
	}
};

export const clearFailedAttempts = async (identifier: string) => {
	await redis.del(attemptsKey(identifier));
};