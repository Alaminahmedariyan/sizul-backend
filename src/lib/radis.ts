import Redis from "ioredis";

import config from "../app/config";

export const redis = new Redis(config.redis.url ?? "", {
	maxRetriesPerRequest: 3,
});

redis.on("error", (error) => {
	console.error("[Redis] Connection error:", error.message);
});