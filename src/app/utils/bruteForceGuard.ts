import { redis } from "../../lib/redis";

const MAX_ATTEMPTS = 5;
const LOCKOUT_SECONDS = 15 * 60;
const ATTEMPT_WINDOW_SECONDS = 15 * 60;

const attemptsKey = (identifier: string) => `login:attempts:${identifier}`;

const lockKey = (identifier: string) => `login:locked:${identifier}`;

export const isLocked = async (identifier: string): Promise<boolean> => {
  if (!redis) {
    return false;
  }

  try {
    const locked = await redis.get(lockKey(identifier));

    return Boolean(locked);
  } catch (error) {
    console.error("[BruteForce] Failed to check lock status:", error);

    return false;
  }
};

export const recordFailedAttempt = async (
  identifier: string,
): Promise<void> => {
  if (!redis) {
    return;
  }

  try {
    const key = attemptsKey(identifier);

    const attempts = await redis.incr(key);

    if (attempts === 1) {
      await redis.expire(key, ATTEMPT_WINDOW_SECONDS);
    }

    if (attempts >= MAX_ATTEMPTS) {
      await redis.set(lockKey(identifier), "1", "EX", LOCKOUT_SECONDS);

      await redis.del(key);
    }
  } catch (error) {
    console.error("[BruteForce] Failed to record failed attempt:", error);
  }
};

export const clearFailedAttempts = async (
  identifier: string,
): Promise<void> => {
  if (!redis) {
    return;
  }

  try {
    await redis.del(attemptsKey(identifier));
  } catch (error) {
    console.error("[BruteForce] Failed to clear failed attempts:", error);
  }
};
