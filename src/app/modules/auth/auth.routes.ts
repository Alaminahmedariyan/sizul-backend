import { Router } from "express";

import {
	authRateLimiter,
	publicRateLimiter,
} from "../../middlewares/rateLimiters";
import { requireAuth } from "../../middlewares/requireAuth";
import { validateRequest } from "../../middlewares/validateRequest";

import { authController } from "./auth.controller";
import { authValidation } from "./auth.validation";

const router = Router();

// Public authentication routes
router.post(
	"/register",
	publicRateLimiter,
	validateRequest(authValidation.registerSchema),
	authController.register,
);

router.post(
	"/login",
	authRateLimiter,
	validateRequest(authValidation.loginSchema),
	authController.login,
);

// Protected authentication routes
router.post(
	"/logout",
	requireAuth,
	authController.logout,
);

// OTP routes
router.post(
	"/send-otp",
	publicRateLimiter,
	validateRequest(authValidation.sendEmailOtpSchema),
	authController.sendEmailOtp,
);

router.post(
	"/verify-email-otp",
	publicRateLimiter,
	validateRequest(authValidation.verifyEmailOtpSchema),
	authController.verifyEmailOtp,
);

router.post(
	"/reset-password-otp",
	publicRateLimiter,
	validateRequest(authValidation.resetPasswordOtpSchema),
	authController.resetPasswordWithOtp,
);

// Password management
router.post(
	"/change-password",
	requireAuth,
	validateRequest(authValidation.changePasswordSchema),
	authController.changePassword,
);

// Current authenticated user
router.get(
	"/me",
	requireAuth,
	authController.getMe,
);

export const authRoutes = router;