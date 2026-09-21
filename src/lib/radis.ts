import Redis from "ioredis";

import config from "../app/config";

export const redis = config.redis.url
	? new Redis(config.redis.url, {
			maxRetriesPerRequest: 3,
			enableReadyCheck: true,
		})
	: null;

if (redis) {
	redis.on("error", (error) => {
		console.error("[Redis] Connection error:", error.message);
	});

	redis.on("connect", () => {
		console.log("[Redis] Connected.");
	});
}