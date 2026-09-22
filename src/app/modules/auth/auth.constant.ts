export const AUTH_FALLBACK_MESSAGES = {
	REGISTER: "Registration failed. Please try again.",
	LOGIN: "Invalid email or password.",
	LOGOUT: "Logout failed. Please try again.",
	REFRESH_TOKEN: "Could not refresh session. Please log in again.",
	SEND_OTP: "Could not send the verification code.",
	VERIFY_EMAIL_OTP:
		"Email verification failed. The code may be invalid or expired.",
	RESET_PASSWORD_OTP:
		"Password reset failed. The code may be invalid or expired.",
	CHANGE_PASSWORD: "Could not change password. Please try again.",
} as const;

/**
 * Roles must match `enum UserRole` in schema.prisma:
 *   ADMIN | STAFF | CLIENT
 */
export const USER_ROLES = {
	ADMIN: "ADMIN",
	STAFF: "STAFF",
	CLIENT: "CLIENT",
} as const;

export type UserRoleValue = (typeof USER_ROLES)[keyof typeof USER_ROLES];

/**
 * Must match `enum UserStatus` in schema.prisma:
 *   ACTIVE | INACTIVE | SUSPENDED
 */
export const USER_STATUSES = {
	ACTIVE: "ACTIVE",
	INACTIVE: "INACTIVE",
	SUSPENDED: "SUSPENDED",
} as const;

export type UserStatusValue = (typeof USER_STATUSES)[keyof typeof USER_STATUSES];