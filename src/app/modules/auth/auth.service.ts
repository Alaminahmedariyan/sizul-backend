import { auth } from "../../../lib/auth";
import AppError from "../../errors/appError";
import { AUTH_FALLBACK_MESSAGES } from "./auth.constant";
import type {
	ChangePasswordInput,
	LoginInput,
	RegisterInput,
	ResetPasswordOtpInput,
	SendEmailOtpInput,
	VerifyEmailOtpInput,
} from "./auth.interface";

/**
 * Centralized wrapper around Better Auth API calls.
 *
 * Why `asResponse: true`?
 *   - We get the HTTP status code and Set-Cookie headers ourselves
 *   - We forward cookies through `applyAuthCookies`
 *   - We throw a typed `AppError` on failure so the global error handler
 *     produces our standard `{ success, message }` shape
 */
const callAuthEndpoint = async (
	responsePromise: Promise<Response>,
	fallbackMessage: string,
) => {
	const response = await responsePromise;
	const body = await response.json().catch(() => null);

	if (!response.ok) {
		console.error(
			`[Auth] ${response.status} error:`,
			body ?? response.statusText,
		);

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

/* ============================================================
   Register / Login / Logout / Refresh
   ============================================================ */

const register = (payload: RegisterInput, headers: Headers) =>
	callAuthEndpoint(
		auth.api.signUpEmail({
			body: {
				/**
				 * `role` is an additionalField with `input: false`, so Better Auth
				 * ignores it on the wire. `defaultValue: "CLIENT"` in lib/auth.ts
				 * drives the actual value. We still pass `name`/`email`/`password`.
				 * The cast is here because Better Auth's generated types don't
				 * know about our extra field shape.
				 */
				name: payload.name,
				email: payload.email,
				password: payload.password,
			} as any,
			headers,
			asResponse: true,
		}),
		AUTH_FALLBACK_MESSAGES.REGISTER,
	);

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

/**
 * Better Auth uses sliding-expiry sessions (`session.updateAge` in lib/auth.ts)
 * rather than a classic access/refresh token pair. Reading the current session
 * via `getSession()` is itself what extends it.
 *
 * This endpoint exists mainly to give the required `/auth/refresh-token`
 * route a real, working implementation.
 */
const refreshToken = (headers: Headers) =>
	callAuthEndpoint(
		auth.api.getSession({
			headers,
			asResponse: true,
		}),
		AUTH_FALLBACK_MESSAGES.REFRESH_TOKEN,
	);

/* ============================================================
   Email OTP
   ============================================================ */

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

/* ============================================================
   Password management
   ============================================================ */

const changePassword = (payload: ChangePasswordInput, headers: Headers) =>
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
	refreshToken,
	sendEmailOtp,
	verifyEmailOtp,
	resetPasswordWithOtp,
	changePassword,
};