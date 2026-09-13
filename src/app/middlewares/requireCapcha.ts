import type { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";

import AppError from "../errors/appError";
import { catchAsync } from "../utils/catchAsync";
import { verifyCaptcha } from "../utils/verifyCaptcha";

export const requireCaptcha = catchAsync(async (req: Request, _res: Response, next: NextFunction) => {
	const token = req.body?.captchaToken;

	if (!token) {
		throw new AppError(StatusCodes.BAD_REQUEST, "Captcha token is required.");
	}

	await verifyCaptcha(token);
	next();
});