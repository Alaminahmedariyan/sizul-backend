import rateLimit from "express-rate-limit";
import { StatusCodes } from "http-status-codes";

const makeLimiter = (windowMs: number, limit: number, message: string) =>
	rateLimit({
		windowMs,
		limit,
		standardHeaders: true,
		legacyHeaders: false,
		message: { success: false, statusCode: StatusCodes.TOO_MANY_REQUESTS, message },
	});

export const generalRateLimiter = makeLimiter(15 * 60 * 1000, 300, "Too many requests. Please try again later.");

export const authRateLimiter = makeLimiter(15 * 60 * 1000, 10, "Too many login attempts. Please try again in 15 minutes.");

export const publicRateLimiter = makeLimiter(15 * 60 * 1000, 20, "Too many requests. Please try again later.");