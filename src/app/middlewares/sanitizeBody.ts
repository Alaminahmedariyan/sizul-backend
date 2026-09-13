import type { NextFunction, Request, Response } from "express";

const UNSAFE_KEYS = ["__proto__", "constructor", "prototype"];

const stripUnsafeKeys = (value: unknown): unknown => {
	if (Array.isArray(value)) return value.map(stripUnsafeKeys);

	if (value !== null && typeof value === "object") {
		const clean: Record<string, unknown> = {};
		for (const [key, val] of Object.entries(value)) {
			if (UNSAFE_KEYS.includes(key)) continue;
			clean[key] = stripUnsafeKeys(val);
		}
		return clean;
	}

	return value;
};

export const sanitizeBody = (req: Request, _res: Response, next: NextFunction) => {
	if (req.body && typeof req.body === "object") {
		req.body = stripUnsafeKeys(req.body);
	}
	next();
};