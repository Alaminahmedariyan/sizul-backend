import { fromNodeHeaders } from "better-auth/node";
import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";

import type { AuthenticatedUser } from "../../middlewares/requireAuth";
import { applyAuthCookies } from "../../utils/authCookies";
import { catchAsync } from "../../utils/catchAsync";

import { authService } from "./auth.service";

const register = catchAsync(async (req: Request, res: Response) => {
	const { data, headers } = await authService.register(
		req.body,
		fromNodeHeaders(req.headers),
	);

	applyAuthCookies(headers, res);

	res.status(StatusCodes.CREATED).json({
		success: true,
		message:
			"Registered successfully. Please check your email for the verification code.",
		data,
	});
});

const login = catchAsync(async (req: Request, res: Response) => {
	const { data, headers } = await authService.login(
		req.body,
		fromNodeHeaders(req.headers),
	);

	applyAuthCookies(headers, res);

	res.status(StatusCodes.OK).json({
		success: true,
		message: "Logged in successfully.",
		data,
	});
});

const logout = catchAsync(async (req: Request, res: Response) => {
	const { data, headers } = await authService.logout(
		fromNodeHeaders(req.headers),
	);

	applyAuthCookies(headers, res);

	res.status(StatusCodes.OK).json({
		success: true,
		message: "Logged out successfully.",
		data,
	});
});

const sendEmailOtp = catchAsync(async (req: Request, res: Response) => {
	const { data } = await authService.sendEmailOtp(req.body);

	res.status(StatusCodes.OK).json({
		success: true,
		message: "Verification code sent.",
		data,
	});
});

const verifyEmailOtp = catchAsync(async (req: Request, res: Response) => {
	const { data } = await authService.verifyEmailOtp(req.body);

	res.status(StatusCodes.OK).json({
		success: true,
		message: "Email verified successfully.",
		data,
	});
});

const resetPasswordWithOtp = catchAsync(
	async (req: Request, res: Response) => {
		const { data } = await authService.resetPasswordWithOtp(req.body);

		res.status(StatusCodes.OK).json({
			success: true,
			message: "Password reset successfully. You can now log in.",
			data,
		});
	},
);

const changePassword = catchAsync(async (req: Request, res: Response) => {
	const { data, headers } = await authService.changePassword(
		req.body,
		fromNodeHeaders(req.headers),
	);

	applyAuthCookies(headers, res);

	res.status(StatusCodes.OK).json({
		success: true,
		message: "Password changed successfully.",
		data,
	});
});

const getMe = catchAsync(async (req: Request, res: Response) => {
	res.status(StatusCodes.OK).json({
		success: true,
		message: "Current user retrieved successfully.",
		data: req.user as AuthenticatedUser,
	});
});

export const authController = {
	register,
	login,
	logout,
	sendEmailOtp,
	verifyEmailOtp,
	resetPasswordWithOtp,
	changePassword,
	getMe,
};