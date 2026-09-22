export type RegisterInput = {
	name: string;
	email: string;
	password: string;
	/**
	 * Optional — defaults to CLIENT in the schema.
	 * Public signup should not pass this; only admin-invite flows should.
	 */
	role?: "ADMIN" | "STAFF" | "CLIENT";
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

/**
 * Shape of `req.user` after `requireAuth` middleware runs.
 * Mirrors the `User` model in schema.prisma.
 */
export type AuthenticatedUser = {
	id: string;
	email: string;
	name: string | null;
	image: string | null;
	role: "ADMIN" | "STAFF" | "CLIENT";
	status: "ACTIVE" | "INACTIVE" | "SUSPENDED";
	emailVerified: boolean;
	twoFactorEnabled: boolean;
	lastLoginAt: Date | null;
	createdAt: Date;
	updatedAt: Date;
};