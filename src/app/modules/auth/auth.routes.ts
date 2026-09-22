import { Router } from "express";

import {
	authRateLimiter,
	publicRateLimiter,
} from "../../middlewares/rateLimiters";
import { requireAuth } from "../../middlewares/requireAuth";
import { validateRequest } from "../../middlewares/validateRequest";

import { authController } from "./auth.controller";
import { authValidation } from "./auth.validation";

/* ============================================================
   ROUTER #1 — Application API
   Mounted at: /api/v1/auth
   ============================================================ */

const router = Router();

/* ------------------------------------------------------------
   Public routes
   ------------------------------------------------------------ */

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

/* ------------------------------------------------------------
   Session-aware routes
   ------------------------------------------------------------ */

/**
 * Logout and refresh-token MUST NOT use requireAuth.
 *
 * Reason: when a session is expired/invalid the client still needs
 * to be able to call these endpoints (logout to clear stale cookies,
 * refresh-token to attempt renewal). Better Auth itself returns 401
 * when appropriate.
 */
router.post("/logout", authController.logout);
router.post("/refresh-token", authController.refreshToken);

router.post(
	"/change-password",
	requireAuth,
	validateRequest(authValidation.changePasswordSchema),
	authController.changePassword,
);

router.get("/session", requireAuth, authController.getMySession);

export const authRoutes = router;

/* ============================================================
   ROUTER #2 — Rate limiters for Better Auth's native endpoints
   Mounted at: /api/auth  (BEFORE toNodeHandler(auth))
   ============================================================ */

const rateLimitRouter = Router();

// /sign-in/email, /sign-in/social, ...
rateLimitRouter.use("/sign-in", authRateLimiter);

// /sign-up/email
rateLimitRouter.use("/sign-up", authRateLimiter);

// /email-otp/send-verification-otp, /email-otp/verify-email,
// /email-otp/request-password-reset, ...
rateLimitRouter.use("/email-otp", authRateLimiter);

// Classic email/password reset (only if you enable it later)
rateLimitRouter.use("/forget-password", authRateLimiter);

export const authRateLimitRoutes = rateLimitRouter;