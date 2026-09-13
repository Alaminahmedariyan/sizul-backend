export const AUTH_FALLBACK_MESSAGES = {
	REGISTER: "Registration failed.",
	LOGIN: "Invalid email or password.",
	LOGOUT: "Logout failed.",
	SEND_OTP: "Could not send the verification code.",
	VERIFY_EMAIL_OTP: "Email verification failed. The code may be invalid or expired.",
	RESET_PASSWORD_OTP: "Password reset failed. The code may be invalid or expired.",
	CHANGE_PASSWORD: "Could not change password.",
} as const;