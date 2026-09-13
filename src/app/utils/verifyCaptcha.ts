import { StatusCodes } from "http-status-codes";

import config from "../config";
import AppError from "../errors/appError";

interface HCaptchaResponse {
	success: boolean;
	"error-codes"?: string[];
}

export const verifyCaptcha = async (token: string): Promise<void> => {
	if (!config.captcha.hcaptchaSecretKey) return;

	const response = await fetch("https://hcaptcha.com/siteverify", {
		method: "POST",
		headers: {
			"Content-Type": "application/x-www-form-urlencoded",
		},
		body: new URLSearchParams({
			secret: config.captcha.hcaptchaSecretKey,
			response: token,
		}),
	});

	if (!response.ok) {
		throw new AppError(
			StatusCodes.BAD_GATEWAY,
			"Captcha verification service is unavailable.",
		);
	}

	const result = (await response.json()) as HCaptchaResponse;

	if (!result.success) {
		throw new AppError(
			StatusCodes.BAD_REQUEST,
			"Captcha verification failed.",
		);
	}
};