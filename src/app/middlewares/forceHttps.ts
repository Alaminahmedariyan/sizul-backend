import type { NextFunction, Request, Response } from "express";

export const forceHttps = (req: Request, res: Response, next: NextFunction) => {
	const isSecure = req.secure || req.headers["x-forwarded-proto"] === "https";

	if (!isSecure) {
		return res.redirect(301, `https://${req.headers.host}${req.originalUrl}`);
	}

	next();
};