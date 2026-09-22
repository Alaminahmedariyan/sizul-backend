import { betterAuth } from "better-auth";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { redisStorage } from "@better-auth/redis-storage";
import { bearer, emailOTP, twoFactor } from "better-auth/plugins";

import config from "../app/config";
import {
	clearFailedAttempts,
	isLocked,
	recordFailedAttempt,
} from "../app/utils/bruteForceGuard";
import {
	otpEmailTemplate,
	resetPasswordEmailTemplate,
	welcomeEmailTemplate,
} from "../app/utils/emailTemplates";
import { sendEmail } from "../app/utils/sendEmail";
import {
	signInEmailValidation,
	signUpEmailValidation,
} from "../app/modules/auth/auth.validation";
import { prisma } from "./prisma";
import { redis } from "./redis";

/* ============================================================
   Constants
   ============================================================ */

const APP_NAME = "Sizul";

/* Session — 7 days, sliding expiry at 1 day */
const SESSION_EXPIRES_IN_SECONDS = 7 * 24 * 60 * 60;
const SESSION_UPDATE_AGE_SECONDS = 24 * 60 * 60;

/* OTP — 5 min prod / 60 min dev */
const OTP_EXPIRES_IN_SECONDS =
	config.app.env === "production" ? 5 * 60 : 60 * 60;
const OTP_EXPIRY_MINUTES = config.app.env === "production" ? 5 : 60;

/* Brute force lockout — 15 minutes after 5 failed attempts */
const LOCKOUT_WINDOW_MINUTES = 15;

/* ============================================================
   Social Providers (conditional)
   ============================================================ */

const socialProviders: Record<
	string,
	{ clientId: string; clientSecret: string }
> = {};

if (config.oauth.google.clientId && config.oauth.google.clientSecret) {
	socialProviders.google = {
		clientId: config.oauth.google.clientId,
		clientSecret: config.oauth.google.clientSecret,
	};
}

/* ============================================================
   Trusted Origins
   ============================================================ */

const trustedOrigins = [
	"http://localhost:3000",
	"http://127.0.0.1:3000",
	...config.app.clientUrl
		.split(",")
		.map((origin) => origin.trim())
		.filter(Boolean),
].filter((origin, index, origins) => origins.indexOf(origin) === index);

if (config.app.env !== "production") {
	trustedOrigins.push("null");
}

/* ============================================================
   Secondary Storage (Redis)
   ------------------------------------------------------------
   When Redis is configured, Better Auth stores:
     - Sessions
     - Email OTP codes
     - Verification tokens

   in Redis instead of the database. This speeds up
   `getSession()` (the hot path on every protected request)
   and avoids NeonDB cold-start latency.

   When Redis is NOT configured, we omit the option and Better
   Auth falls back to the Prisma adapter automatically.
   ============================================================ */

const secondaryStorage = redis
	? redisStorage({
			client: redis,
			keyPrefix: "sizul:auth:",
		})
	: undefined;

if (secondaryStorage) {
	console.log("[Auth] Redis secondary storage enabled.");
} else {
	console.warn(
		"[Auth] Redis not configured. Sessions/OTPs will use the database.",
	);
}

/* ============================================================
   Helpers
   ============================================================ */

/**
 * Fire-and-forget email dispatch.
 *
 * Email delivery is never on the critical path of an auth
 * response. Blocking on SMTP latency (2-8s) destroys the user
 * experience and causes serverless timeouts.
 *
 * The calling code still gets a promise (void), so nothing
 * awaits it — the response is returned immediately.
 */
const dispatchEmail = (sendFn: () => Promise<void>): void => {
	void (async () => {
		try {
			await sendFn();
		} catch (err) {
			console.error("[Auth] Email dispatch failed:", err);
		}
	})();
};

/* ============================================================
   Better Auth instance
   ============================================================ */

export const auth = betterAuth({
	baseURL: config.betterAuth.url,
	basePath: "/api/auth",

	logger: {
		disabled: false,
		level: config.app.env === "production" ? "warn" : "debug",
	},

	/* ----------------------------------------------------------
	   Database
	   ---------------------------------------------------------- */
	database: prismaAdapter(prisma, { provider: "postgresql" }),

	/* ----------------------------------------------------------
	   Redis secondary storage (conditionally applied)
	   ---------------------------------------------------------- */
	...(secondaryStorage && { secondaryStorage }),

	/* ----------------------------------------------------------
	   User — matches schema.prisma `User` model
	   ------------------------------------------------------------
	   `role` and `status` are enums (ADMIN|STAFF|CLIENT and
	   ACTIVE|INACTIVE|SUSPENDED). `input: false` prevents clients
	   from setting them via signup — server enforces defaults.
	   ---------------------------------------------------------- */
	user: {
		additionalFields: {
			role: {
				type: "string",
				required: false,
				defaultValue: "CLIENT",
				input: false,
			},
			status: {
				type: "string",
				required: false,
				defaultValue: "ACTIVE",
				input: false,
			},
		},
	},

	/* ----------------------------------------------------------
	   Email + Password
	   ---------------------------------------------------------- */
	emailAndPassword: {
		enabled: true,
		requireEmailVerification: config.app.env === "production",
		minPasswordLength: 8,
		maxPasswordLength: 128,

		sendResetPassword: async ({ user, url }) => {
			dispatchEmail(async () => {
				await sendEmail({
					to: user.email,
					subject: "Reset your password",
					html: resetPasswordEmailTemplate(user.name ?? "there", url),
				});
			});
		},
	},

	/* ----------------------------------------------------------
	   Email Verification
	   ------------------------------------------------------------
	   The emailOTP plugin uses `overrideDefaultEmailVerification: true`,
	   so verification is handled by OTP — not by a magic link.
	   Only `autoSignInAfterVerification` is kept here.
	   ---------------------------------------------------------- */
	emailVerification: {
		autoSignInAfterVerification: true,
	},

	socialProviders,
	trustedOrigins,

	/* ----------------------------------------------------------
	   Session
	   ---------------------------------------------------------- */
	session: {
		expiresIn: SESSION_EXPIRES_IN_SECONDS,
		updateAge: SESSION_UPDATE_AGE_SECONDS,
	},

	/* ----------------------------------------------------------
	   Advanced — cookie security
	   ---------------------------------------------------------- */
	advanced: {
		useSecureCookies: config.app.env === "production",
		defaultCookieAttributes: {
			sameSite: config.app.env === "production" ? "none" : "lax",
			secure: config.app.env === "production",
		},
	},

	/* ==========================================================
	   Plugins
	   ========================================================== */
	plugins: [
		/* Bearer token support (API clients / mobile) */
		bearer(),

		/* Two-factor authentication */
		twoFactor({
			issuer: APP_NAME,
		}),

		/* Email OTP — owns email verification, sign-in OTPs, and password reset */
		emailOTP({
			otpLength: 6,
			expiresIn: OTP_EXPIRES_IN_SECONDS,
			allowedAttempts: 5,
			overrideDefaultEmailVerification: true,

			sendVerificationOTP: async ({ email, otp, type }) => {
				dispatchEmail(async () => {
					const user = await prisma.user.findUnique({
						where: { email },
					});
					const name = user?.name ?? "there";

					const subjectAndPurpose =
						type === "sign-in"
							? { subject: "Your sign-in code", purpose: "sign in" }
							: type === "email-verification"
								? {
										subject: "Verify your email",
										purpose: "verify your email",
									}
								: {
										subject: "Reset your password",
										purpose: "reset your password",
									};

					if (config.app.env !== "production") {
						console.log(
							`[Email OTP] ${subjectAndPurpose.purpose} for ${email}: ${otp}`,
						);
					}

					await sendEmail({
						to: email,
						subject: subjectAndPurpose.subject,
						html: otpEmailTemplate(
							name,
							otp,
							OTP_EXPIRY_MINUTES,
							subjectAndPurpose.purpose,
						),
					});
				});
			},
		}),
	],

	/* ==========================================================
	   Hooks — validation + brute-force protection
	   ------------------------------------------------------------
	   Before hook:
	     - Validates sign-up/sign-in bodies with Zod
	     - Blocks requests from locked-out emails

	   After hook:
	     - Records failed sign-in attempts (Redis)
	     - Clears the counter on success
	   ========================================================== */
	hooks: {
		before: createAuthMiddleware(async (ctx) => {
			/* ---- Sign up: schema validation ---- */
			if (ctx.path === "/sign-up/email") {
				const parsed = signUpEmailValidation.safeParse(ctx.body);
				if (!parsed.success) {
					throw new APIError("BAD_REQUEST", {
						message:
							parsed.error.issues[0]?.message ??
							"Invalid registration details.",
					});
				}
			}

			/* ---- Sign in: schema validation + lockout check ---- */
			if (ctx.path === "/sign-in/email") {
				const parsed = signInEmailValidation.safeParse(ctx.body);
				if (!parsed.success) {
					throw new APIError("BAD_REQUEST", {
						message:
							parsed.error.issues[0]?.message ??
							"Invalid login details.",
					});
				}

				const email = ctx.body?.email as string | undefined;
				if (email && (await isLocked(email))) {
					throw new APIError("TOO_MANY_REQUESTS", {
						message: `Too many failed login attempts. Please try again in ${LOCKOUT_WINDOW_MINUTES} minutes.`,
					});
				}
			}
		}),

		after: createAuthMiddleware(async (ctx) => {
			/* ---- Sign in: track failures for brute-force lockout ---- */
			if (ctx.path !== "/sign-in/email") return;

			const email = ctx.body?.email as string | undefined;
			if (!email) return;

			const returned = ctx.context.returned as
				| { status?: number }
				| undefined;

			const failed = Boolean(
				returned &&
					typeof returned === "object" &&
					"status" in returned &&
					(returned.status ?? 0) >= 400,
			);

			try {
				if (failed) {
					await recordFailedAttempt(email);
				} else {
					await clearFailedAttempts(email);
				}
			} catch (err) {
				// Redis failure should never break the auth response.
				console.error("[Auth] Brute-force guard failed:", err);
			}
		}),
	},

	/* ==========================================================
	   Database Hooks
	   ------------------------------------------------------------
	   Fires for BOTH credential signup AND OAuth (Google/GitHub)
	   signup, since both create a User row the same way.
	   ========================================================== */
	databaseHooks: {
		user: {
			create: {
				after: async (user) => {
					/* ---- 1. Welcome email (fire-and-forget) ---- */
					dispatchEmail(async () => {
						await sendEmail({
							to: user.email,
							subject: `Welcome, ${user.name ?? "there"}!`,
							html: welcomeEmailTemplate(user.name ?? "there"),
						});
					});

					/* ---- 2. Auto-create Client profile ---- */
					const role =
						(user as unknown as { role?: string }).role ?? "CLIENT";

					// Skip for super admin or non-CLIENT roles
					if (
						role !== "CLIENT" ||
						user.email === config.superAdmin.email
					) {
						return;
					}

					try {
						/*
						 * Single upsert by email — 1 DB round trip instead of 2.
						 *
						 * Handles both cases:
						 *   (a) Brand-new client → INSERT
						 *   (b) Orphan client from a previous account
						 *       with the same email → re-link to new user
						 *
						 * `email` is @unique in the schema, so `where: { email }`
						 * is valid.
						 */
						await prisma.client.upsert({
							where: { email: user.email },
							create: {
								userId: user.id,
								name:
									user.name ||
									user.email.split("@")[0] ||
									"Client",
								email: user.email,
							},
							update: {
								// Re-link orphaned client (userId was null)
								userId: user.id,
							},
						});

						if (config.app.env !== "production") {
							console.log(
								`[Auth] Client upserted for: ${user.email}`,
							);
						}
					} catch (err) {
						/*
						 * P2002 = unique constraint on userId.
						 * Can happen if two signups for the same email
						 * race. Non-fatal — the user still exists.
						 */
						if (
							typeof err === "object" &&
							err !== null &&
							"code" in err &&
							(err as { code: string }).code === "P2002"
						) {
							console.warn(
								"[Auth] Client already exists (race) for:",
								user.email,
							);
						} else {
							console.error(
								"[Auth] Failed to auto-create Client profile:",
								err,
							);
						}
					}
				},
			},
		},
	},
});