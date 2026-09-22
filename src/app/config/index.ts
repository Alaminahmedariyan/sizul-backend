import "dotenv/config";

import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),

  PORT: z.coerce.number().int().positive().default(5000),

  CLIENT_URL: z.string().min(1).default("http://localhost:3000"),

  DATABASE_URL: z.string().min(1, "DATABASE_URL is required."),

  BETTER_AUTH_SECRET: z
    .string()
    .min(32, "BETTER_AUTH_SECRET must be at least 32 characters.")
    .optional(),

  BETTER_AUTH_URL: z.string().url().default("http://localhost:5000"),

  /* ============================================================
     OAuth — Google only
     ============================================================ */
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),

  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),

  /* ============================================================
     Email — SMTP / Nodemailer
     ============================================================ */
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().positive().default(587),
  SMTP_SECURE: z
    .string()
    .optional()
    .transform((v) => v === "true"),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  SMTP_FROM_EMAIL: z.string().email().optional(),
  SMTP_FROM_NAME: z.string().default("Sizul"),

  REDIS_URL: z.string().min(1).optional(),

  STRIPE_PRODUCT_ID: z.string().optional(),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),

  SUPER_ADMIN_NAME: z.string().optional(),

  SUPER_ADMIN_EMAIL: z.string().email(),

  SUPER_ADMIN_PASSWORD: z.string().min(8),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid or missing environment variables:");
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

const env = parsed.data;

if (env.NODE_ENV === "production" && !env.BETTER_AUTH_SECRET) {
  console.error("❌ BETTER_AUTH_SECRET is required in production.");
  process.exit(1);
}

const clientUrls = env.CLIENT_URL.split(",")
  .map((url) => url.trim())
  .filter(Boolean);

for (const clientUrl of clientUrls) {
  const result = z.string().url().safeParse(clientUrl);
  if (!result.success) {
    console.error(`❌ Invalid CLIENT_URL value: ${clientUrl}`);
    process.exit(1);
  }
}

const config = {
  app: {
    env: env.NODE_ENV,
    port: env.PORT,
    clientUrl: env.CLIENT_URL,
  },

  database: {
    url: env.DATABASE_URL,
  },

  betterAuth: {
    secret: env.BETTER_AUTH_SECRET,
    url: env.BETTER_AUTH_URL,
  },

  /* ============================================================
     OAuth — Google only
     ============================================================ */
  oauth: {
    google: {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    },
  },

  cloudinary: {
    cloudName: env.CLOUDINARY_CLOUD_NAME,
    apiKey: env.CLOUDINARY_API_KEY,
    apiSecret: env.CLOUDINARY_API_SECRET,
  },

  /* ============================================================
     Email — matches lib/nodemailer.ts and utils/sendEmail.ts
     ============================================================ */
  email: {
    // SMTP connection
    smtpHost: env.SMTP_HOST ?? "",
    smtpPort: env.SMTP_PORT,
    smtpSecure: env.SMTP_SECURE,
    smtpUser: env.SMTP_USER ?? "",
    smtpPassword: env.SMTP_PASSWORD ?? "",

    // From header
    fromEmail: env.SMTP_FROM_EMAIL ?? env.SMTP_USER ?? "",
    fromName: env.SMTP_FROM_NAME,
  },

  redis: {
    url: env.REDIS_URL,
  },

  stripe: {
    productId: env.STRIPE_PRODUCT_ID,
    secretKey: env.STRIPE_SECRET_KEY,
    webhookSecret: env.STRIPE_WEBHOOK_SECRET,
  },

  superAdmin: {
    email: env.SUPER_ADMIN_EMAIL,
    password: env.SUPER_ADMIN_PASSWORD,
    name: env.SUPER_ADMIN_NAME ?? "Super Admin",
  },
} as const;

export default config;