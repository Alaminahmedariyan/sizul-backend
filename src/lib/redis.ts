import Redis from "ioredis";

import config from "../app/config";

/* ============================================================
   Redis Client
   ------------------------------------------------------------
   Upstash TCP requires:
     - rediss:// (TLS) — set in .env
     - enableReadyCheck: false — Upstash rejects INFO command
     - maxRetriesPerRequest: null — queue commands offline
     - keepAlive — Upstash closes idle sockets

   Without those, ioredis connects then immediately drops,
   causing an infinite reconnect loop.
   ============================================================ */

const createRedis = (): Redis | null => {
	if (!config.redis.url) {
		console.warn(
			"[Redis] REDIS_URL not set. Session/OTP will fall back to the database.",
		);
		return null;
	}

	const client = new Redis(config.redis.url, {
		/* Exponential backoff, capped at 2s */
		retryStrategy: (times) => Math.min(times * 50, 2000),

		/*
		 * CRITICAL for Upstash.
		 * null = queue commands while offline.
		 * A number (like 3) makes every pending command fail after
		 * N attempts — that is what caused your reconnect loop.
		 */
		maxRetriesPerRequest: null,

		/*
		 * CRITICAL for Upstash.
		 * Upstash does not answer the INFO command used by the
		 * default ready-check, so every connection fails the check
		 * and ioredis drops it. Disable it.
		 */
		enableReadyCheck: false,

		/* Queue commands while offline instead of throwing */
		enableOfflineQueue: true,

		/* Give up after 10s if TCP connect cannot be established */
		connectTimeout: 10_000,

		/* Keep TCP socket alive — Upstash closes idle sockets */
		keepAlive: 10_000,

		/* Connect immediately on startup */
		lazyConnect: false,
	});

	client.on("connect", () => {
		console.log("[Redis] Connected ✅");
	});

	client.on("ready", () => {
		console.log("[Redis] Ready to accept commands.");
	});

	client.on("error", (error) => {
		console.error("[Redis] Error:", error.message);
	});

	client.on("reconnecting", (delay: number) => {
		console.warn(`[Redis] Reconnecting in ${delay}ms...`);
	});

	client.on("end", () => {
		console.warn("[Redis] Connection closed.");
	});

	return client;
};

export const redis = createRedis();

/**
 * Type-safe getter — throws if Redis was never configured.
 */
export const getRedis = (): Redis => {
	if (!redis) {
		throw new Error(
			"[Redis] Cannot use Redis — REDIS_URL is not configured.",
		);
	}
	return redis;
};