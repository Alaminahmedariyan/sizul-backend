import { StatusCodes } from "http-status-codes";

import AppError from "../../errors/appError";
import { auth } from "../../../lib/auth";
import { verifyCaptcha } from "../../utils/verifyCaptcha";
import type {
	ChangePasswordInput,
	LoginInput,
	RegisterInput,
	ResetPasswordOtpInput,
	SendEmailOtpInput,
	VerifyEmailOtpInput,
} from "./auth.interface";
import { AUTH_FALLBACK_MESSAGES } from "./auth.const";

const callAuthEndpoint = async (
	responsePromise: Promise<Response>,
	fallbackMessage: string,
) => {
	const response = await responsePromise;
	const body = await response.json().catch(() => null);

	if (!response.ok) {
		throw new AppError(
			response.status,
			(body as { message?: string } | null)?.message ?? fallbackMessage,
		);
	}

	return {
		data: body,
		headers: response.headers,
	};
};

const register = async (payload: RegisterInput, headers: Headers) => {
	if (payload.captchaToken) {
		await verifyCaptcha(payload.captchaToken);
	}

	return callAuthEndpoint(
		auth.api.signUpEmail({
			body: {
				name: payload.name,
				email: payload.email,
				password: payload.password,
			},
			headers,
			asResponse: true,
		}),
		AUTH_FALLBACK_MESSAGES.REGISTER,
	);
};

const login = (payload: LoginInput, headers: Headers) =>
	callAuthEndpoint(
		auth.api.signInEmail({
			body: {
				email: payload.email,
				password: payload.password,
				rememberMe: payload.rememberMe,
			},
			headers,
			asResponse: true,
		}),
		AUTH_FALLBACK_MESSAGES.LOGIN,
	);

const logout = (headers: Headers) =>
	callAuthEndpoint(
		auth.api.signOut({
			headers,
			asResponse: true,
		}),
		AUTH_FALLBACK_MESSAGES.LOGOUT,
	);

const sendEmailOtp = (payload: SendEmailOtpInput) =>
	callAuthEndpoint(
		auth.api.sendVerificationOTP({
			body: {
				email: payload.email,
				type: payload.type,
			},
			asResponse: true,
		}),
		AUTH_FALLBACK_MESSAGES.SEND_OTP,
	);

const verifyEmailOtp = (payload: VerifyEmailOtpInput) =>
	callAuthEndpoint(
		auth.api.verifyEmailOTP({
			body: {
				email: payload.email,
				otp: payload.otp,
			},
			asResponse: true,
		}),
		AUTH_FALLBACK_MESSAGES.VERIFY_EMAIL_OTP,
	);

const resetPasswordWithOtp = (payload: ResetPasswordOtpInput) =>
	callAuthEndpoint(
		auth.api.resetPasswordEmailOTP({
			body: {
				email: payload.email,
				otp: payload.otp,
				password: payload.newPassword,
			},
			asResponse: true,
		}),
		AUTH_FALLBACK_MESSAGES.RESET_PASSWORD_OTP,
	);

const changePassword = (
	payload: ChangePasswordInput,
	headers: Headers,
) =>
	callAuthEndpoint(
		auth.api.changePassword({
			body: {
				currentPassword: payload.currentPassword,
				newPassword: payload.newPassword,
				revokeOtherSessions: payload.revokeOtherSessions,
			},
			headers,
			asResponse: true,
		}),
		AUTH_FALLBACK_MESSAGES.CHANGE_PASSWORD,
	);

export const authService = {
	register,
	login,
	logout,
	sendEmailOtp,
	verifyEmailOtp,
	resetPasswordWithOtp,
	changePassword,
};