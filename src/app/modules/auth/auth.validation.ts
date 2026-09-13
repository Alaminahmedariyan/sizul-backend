import { z } from "zod";

const registerSchema = z.object({
	name: z.string().min(2, "Name must be at least 2 characters."),
	email: z.string().email("Invalid email address."),
	password: z.string().min(8, "Password must be at least 8 characters."),
	captchaToken: z.string().optional(),
});

const loginSchema = z.object({
	email: z.string().email("Invalid email address."),
	password: z.string().min(1, "Password is required."),
	rememberMe: z.boolean().optional(),
});

const sendEmailOtpSchema = z.object({
	email: z.string().email("Invalid email address."),
	type: z.enum(["sign-in", "email-verification", "forget-password"]),
});

const verifyEmailOtpSchema = z.object({
	email: z.string().email("Invalid email address."),
	otp: z.string().length(6, "OTP must be 6 digits."),
});

const resetPasswordOtpSchema = z.object({
	email: z.string().email("Invalid email address."),
	otp: z.string().length(6, "OTP must be 6 digits."),
	newPassword: z.string().min(8, "Password must be at least 8 characters."),
});

const changePasswordSchema = z.object({
	currentPassword: z.string().min(1, "Current password is required."),
	newPassword: z.string().min(8, "Password must be at least 8 characters."),
	revokeOtherSessions: z.boolean().optional(),
});

export const authValidation = {
	registerSchema,
	loginSchema,
	sendEmailOtpSchema,
	verifyEmailOtpSchema,
	resetPasswordOtpSchema,
	changePasswordSchema,
};