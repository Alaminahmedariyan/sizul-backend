export type RegisterInput = {
	name: string;
	email: string;
	password: string;
	captchaToken?: string;
};

export type LoginInput = {
	email: string;
	password: string;
	rememberMe?: boolean;
};

export type SendEmailOtpInput = {
	email: string;
	type: "sign-in" | "email-verification" | "forget-password";
};

export type VerifyEmailOtpInput = {
	email: string;
	otp: string;
};

export type ResetPasswordOtpInput = {
	email: string;
	otp: string;
	newPassword: string;
};

export type ChangePasswordInput = {
	currentPassword: string;
	newPassword: string;
	revokeOtherSessions?: boolean;
};