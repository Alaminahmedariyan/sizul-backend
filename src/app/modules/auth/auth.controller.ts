import { fromNodeHeaders } from "better-auth/node";
import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";

import { applyAuthCookies } from "../../utils/authCookies";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";

import { authService } from "./auth.service";
import type { AuthenticatedUser } from "./auth.interface";

/* ============================================================
   Register / Login / Logout / Refresh
   ============================================================ */

const register = catchAsync(async (req: Request, res: Response) => {
	const { data, headers } = await authService.register(
		req.body,
		fromNodeHeaders(req.headers),
	);

	applyAuthCookies(headers, res);

	sendResponse(res, {
		success: true,
		statusCode: StatusCodes.CREATED,
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

	sendResponse(res, {
		success: true,
		statusCode: StatusCodes.OK,
		message: "Logged in successfully.",
		data,
	});
});

const logout = catchAsync(async (req: Request, res: Response) => {
	const { data, headers } = await authService.logout(
		fromNodeHeaders(req.headers),
	);

	applyAuthCookies(headers, res);

	sendResponse(res, {
		success: true,
		statusCode: StatusCodes.OK,
		message: "Logged out successfully.",
		data,
	});
});

const refreshToken = catchAsync(async (req: Request, res: Response) => {
	const { data, headers } = await authService.refreshToken(
		fromNodeHeaders(req.headers),
	);

	applyAuthCookies(headers, res);

	sendResponse(res, {
		success: true,
		statusCode: StatusCodes.OK,
		message: "Session refreshed successfully.",
		data,
	});
});

/* ============================================================
   Email OTP
   ============================================================ */

const sendEmailOtp = catchAsync(async (req: Request, res: Response) => {
	const { data } = await authService.sendEmailOtp(req.body);

	sendResponse(res, {
		success: true,
		statusCode: StatusCodes.OK,
		message: "Verification code sent.",
		data,
	});
});

const verifyEmailOtp = catchAsync(async (req: Request, res: Response) => {
	const { data } = await authService.verifyEmailOtp(req.body);

	sendResponse(res, {
		success: true,
		statusCode: StatusCodes.OK,
		message: "Email verified successfully.",
		data,
	});
});

const resetPasswordWithOtp = catchAsync(async (req: Request, res: Response) => {
	const { data } = await authService.resetPasswordWithOtp(req.body);

	sendResponse(res, {
		success: true,
		statusCode: StatusCodes.OK,
		message: "Password reset successfully. You can now log in.",
		data,
	});
});

/* ============================================================
   Password management
   ============================================================ */

const changePassword = catchAsync(async (req: Request, res: Response) => {
	const { data, headers } = await authService.changePassword(
		req.body,
		fromNodeHeaders(req.headers),
	);

	applyAuthCookies(headers, res);

	sendResponse(res, {
		success: true,
		statusCode: StatusCodes.OK,
		message: "Password changed successfully.",
		data,
	});
});

/* ============================================================
   Current session
   ------------------------------------------------------------
   Session endpoint lives in the auth module (industry convention).
   Full user profile belongs to `/api/v1/users/me` instead.
   ============================================================ */

const getMySession = catchAsync(async (req: Request, res: Response) => {
	const user = req.user as AuthenticatedUser;

	sendResponse(res, {
		success: true,
		statusCode: StatusCodes.OK,
		message: "Session is active.",
		data: {
			id: user.id,
			email: user.email,
			name: user.name,
			image: user.image,
			role: user.role,
			status: user.status,
			emailVerified: user.emailVerified,
			twoFactorEnabled: user.twoFactorEnabled,
			lastLoginAt: user.lastLoginAt,
		},
	});
});

export const authController = {
	register,
	login,
	logout,
	refreshToken,
	sendEmailOtp,
	verifyEmailOtp,
	resetPasswordWithOtp,
	changePassword,
	getMySession,
};