import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
	// ============================================================
	// Core App
	// ============================================================
	NODE_ENV: z
		.enum(["development", "production", "test"])
		.default("development"),

	PORT: z.coerce.number().default(5000),

	CLIENT_URL: z.string().url(),

	// ============================================================
	// Database
	// ============================================================
	DATABASE_URL: z.string().min(1, "DATABASE_URL is required."),

	// ============================================================
	// Authentication - Better Auth
	// ============================================================
	BETTER_AUTH_SECRET: z.string().min(16).optional(),
	BETTER_AUTH_URL: z.string().url().optional(),

	// ============================================================
	// Authentication - JWT (Alternative)
	// ============================================================
	// JWT_ACCESS_SECRET: z.string().min(16).optional(),
	// JWT_REFRESH_SECRET: z.string().min(16).optional(),
	// JWT_ACCESS_EXPIRES_IN: z.string().default("1d"),
	// JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),
	// BCRYPT_SALT_ROUNDS: z.coerce.number().default(10),

	// ============================================================
	// OAuth
	// ============================================================
	GOOGLE_CLIENT_ID: z.string().optional(),
	GOOGLE_CLIENT_SECRET: z.string().optional(),

	GITHUB_CLIENT_ID: z.string().optional(),
	GITHUB_CLIENT_SECRET: z.string().optional(),

	// ============================================================
	// Cloudinary
	// ============================================================
	CLOUDINARY_CLOUD_NAME: z.string().optional(),
	CLOUDINARY_API_KEY: z.string().optional(),
	CLOUDINARY_API_SECRET: z.string().optional(),

	// ============================================================
	// Email - Resend
	// ============================================================
	RESEND_API_KEY: z.string().optional(),
	EMAIL_FROM: z.string().email().optional(),

	// ============================================================
	// Email - SMTP / Nodemailer (Alternative)
	// ============================================================
	SMTP_USER: z.string().optional(),
	SMTP_PASSWORD: z.string().optional(),

	// ============================================================
	// Redis
	// ============================================================
	REDIS_URL: z.string().optional(),

	// ============================================================
	// Stripe
	// ============================================================
	STRIPE_SECRET_KEY: z.string().optional(),
	STRIPE_WEBHOOK_SECRET: z.string().optional(),

	// ============================================================
	// bKash
	// ============================================================
	BKASH_BASE_URL: z.string().optional(),
	BKASH_USERNAME: z.string().optional(),
	BKASH_PASSWORD: z.string().optional(),
	BKASH_APP_KEY: z.string().optional(),
	BKASH_APP_SECRET: z.string().optional(),
	BKASH_CALLBACK_URL: z.string().optional(),

	// ============================================================
	// SSLCommerz
	// ============================================================
	SSLCOMMERZ_STORE_ID: z.string().optional(),
	SSLCOMMERZ_STORE_PASSWORD: z.string().optional(),
	SSLCOMMERZ_IS_LIVE: z.coerce.boolean().default(false),

	// ============================================================
	// Super Admin
	// ============================================================
	SUPER_ADMIN_NAME: z.string().optional(),
	SUPER_ADMIN_EMAIL: z.string().email(),
	SUPER_ADMIN_PASSWORD: z.string().min(8),

	// ============================================================
	// hCaptcha
	// ============================================================
	HCAPTCHA_SECRET_KEY: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
	console.error("❌ Invalid or missing environment variables:");
	console.error(parsed.error.flatten().fieldErrors);
	process.exit(1);
}

const env = parsed.data;

const config = {
	// ============================================================
	// App
	// ============================================================
	app: {
		env: env.NODE_ENV,
		port: env.PORT,
		clientUrl: env.CLIENT_URL,
	},

	// ============================================================
	// Database
	// ============================================================
	database: {
		url: env.DATABASE_URL,
	},

	// ============================================================
	// Better Auth
	// ============================================================
	betterAuth: {
		secret: env.BETTER_AUTH_SECRET,
		url: env.BETTER_AUTH_URL,
	},

	// ============================================================
	// OAuth
	// ============================================================
	oauth: {
		google: {
			clientId: env.GOOGLE_CLIENT_ID,
			clientSecret: env.GOOGLE_CLIENT_SECRET,
		},

		github: {
			clientId: env.GITHUB_CLIENT_ID,
			clientSecret: env.GITHUB_CLIENT_SECRET,
		},
	},

	// ============================================================
	// Cloudinary
	// ============================================================
	cloudinary: {
		cloudName: env.CLOUDINARY_CLOUD_NAME,
		apiKey: env.CLOUDINARY_API_KEY,
		apiSecret: env.CLOUDINARY_API_SECRET,
	},

	// ============================================================
	// Email
	// ============================================================
	email: {
		resendApiKey: env.RESEND_API_KEY,
		from: env.EMAIL_FROM,
		smtpUser: env.SMTP_USER,
		smtpPassword: env.SMTP_PASSWORD,
	},

	// ============================================================
	// Redis
	// ============================================================
	redis: {
		url: env.REDIS_URL,
	},

	// ============================================================
	// Stripe
	// ============================================================
	stripe: {
		secretKey: env.STRIPE_SECRET_KEY,
		webhookSecret: env.STRIPE_WEBHOOK_SECRET,
	},

	// ============================================================
	// bKash
	// ============================================================
	bkash: {
		baseUrl: env.BKASH_BASE_URL,
		username: env.BKASH_USERNAME,
		password: env.BKASH_PASSWORD,
		appKey: env.BKASH_APP_KEY,
		appSecret: env.BKASH_APP_SECRET,
		callbackUrl: env.BKASH_CALLBACK_URL,
	},

	// ============================================================
	// SSLCommerz
	// ============================================================
	sslcommerz: {
		storeId: env.SSLCOMMERZ_STORE_ID,
		storePassword: env.SSLCOMMERZ_STORE_PASSWORD,
		isLive: env.SSLCOMMERZ_IS_LIVE,
	},

	// ============================================================
	// Super Admin
	// ============================================================
	superAdmin: {
		email: env.SUPER_ADMIN_EMAIL,
		password: env.SUPER_ADMIN_PASSWORD,
		name: env.SUPER_ADMIN_NAME ?? "Super Admin",
	},

	// ============================================================
	// hCaptcha
	// ============================================================
	captcha: {
		hcaptchaSecretKey: env.HCAPTCHA_SECRET_KEY,
	},
} as const;

export default config;