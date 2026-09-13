import type { Response } from "express";

export const applyAuthCookies = (headers: Headers, res: Response) => {
	const setCookieHeaders =
		typeof headers.getSetCookie === "function" ? headers.getSetCookie() : headers.get("set-cookie");

	if (setCookieHeaders && (Array.isArray(setCookieHeaders) ? setCookieHeaders.length > 0 : true)) {
		res.setHeader("set-cookie", setCookieHeaders);
	}
};