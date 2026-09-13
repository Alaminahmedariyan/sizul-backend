import { StatusCodes } from "http-status-codes";

import config from "../app/config";
import AppError from "../app/errors/appError";
import { redis } from "./radis";

const ID_TOKEN_KEY = "bkash:idToken";
const REFRESH_TOKEN_KEY = "bkash:refreshToken";

interface BkashTokenResponse {
	id_token: string;
	refresh_token?: string;
}

export const getBkashIdToken = async (): Promise<string> => {
	if (
		!config.bkash.baseUrl ||
		!config.bkash.username ||
		!config.bkash.password ||
		!config.bkash.appKey ||
		!config.bkash.appSecret
	) {
		throw new AppError(
			StatusCodes.SERVICE_UNAVAILABLE,
			"bKash is not configured.",
		);
	}

	const idToken = await redis.get(ID_TOKEN_KEY);
	const idTokenTTL = await redis.ttl(ID_TOKEN_KEY);

	if (idToken && idTokenTTL > 600) {
		return idToken;
	}

	const refreshToken = await redis.get(REFRESH_TOKEN_KEY);
	const refreshTokenTTL = await redis.ttl(REFRESH_TOKEN_KEY);

	if (refreshToken && refreshTokenTTL > 600) {
		const response = await fetch(
			`${config.bkash.baseUrl}/tokenized/checkout/token/refresh`,
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Accept: "application/json",
					username: config.bkash.username,
					password: config.bkash.password,
				},
				body: JSON.stringify({
					app_key: config.bkash.appKey,
					app_secret: config.bkash.appSecret,
					refresh_token: refreshToken,
				}),
			},
		);

		if (!response.ok) {
			throw new AppError(
				StatusCodes.BAD_GATEWAY,
				"bKash token refresh failed.",
			);
		}

		const result = (await response.json()) as BkashTokenResponse;

		if (!result.id_token) {
			throw new AppError(
				StatusCodes.BAD_GATEWAY,
				"bKash did not return a valid ID token.",
			);
		}

		await redis.set(ID_TOKEN_KEY, result.id_token, "EX", 60 * 60);

		if (result.refresh_token) {
			await redis.set(
				REFRESH_TOKEN_KEY,
				result.refresh_token,
				"EX",
				60 * 60 * 24 * 28,
			);
		}

		return result.id_token;
	}

	const response = await fetch(
		`${config.bkash.baseUrl}/tokenized/checkout/token/grant`,
		{
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Accept: "application/json",
				username: config.bkash.username,
				password: config.bkash.password,
			},
			body: JSON.stringify({
				app_key: config.bkash.appKey,
				app_secret: config.bkash.appSecret,
			}),
		},
	);

	if (!response.ok) {
		throw new AppError(
			StatusCodes.BAD_GATEWAY,
			"bKash token grant failed.",
		);
	}

	const result = (await response.json()) as BkashTokenResponse;

	if (!result.id_token || !result.refresh_token) {
		throw new AppError(
			StatusCodes.BAD_GATEWAY,
			"bKash returned an invalid token response.",
		);
	}

	await redis.set(ID_TOKEN_KEY, result.id_token, "EX", 60 * 60);

	await redis.set(
		REFRESH_TOKEN_KEY,
		result.refresh_token,
		"EX",
		60 * 60 * 24 * 28,
	);

	return result.id_token;
};