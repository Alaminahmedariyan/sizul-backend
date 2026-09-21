import { betterAuth } from "better-auth";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { bearer, emailOTP, twoFactor } from "better-auth/plugins";

import config from "../app/config";

import {
  otpEmailTemplate,
  resetPasswordEmailTemplate,
  verificationEmailTemplate,
  welcomeEmailTemplate,
} from "../app/utils/emailTemplates";

import { sendEmail } from "../app/utils/sendEmail";
import {
  clearFailedAttempts,
  isLocked,
  recordFailedAttempt,
} from "../app/utils/bruteForceGuard";

import {
  signInEmailValidation,
  signUpEmailValidation,
} from "./auth.validation";

import { prisma } from "./prisma";

const socialProviders: Record<
  string,
  {
    clientId: string;
    clientSecret: string;
  }
> = {};

if (
  config.oauth.google.clientId &&
  config.oauth.google.clientSecret
) {
  socialProviders.google = {
    clientId: config.oauth.google.clientId,
    clientSecret: config.oauth.google.clientSecret,
  };
}

if (
  config.oauth.github.clientId &&
  config.oauth.github.clientSecret
) {
  socialProviders.github = {
    clientId: config.oauth.github.clientId,
    clientSecret: config.oauth.github.clientSecret,
  };
}

const trustedOrigins = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",

  ...config.app.clientUrl
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
].filter(
  (origin, index, origins) => origins.indexOf(origin) === index,
);

const APP_NAME = "Nexivo AI";

export const auth = betterAuth({
  baseURL: config.betterAuth.url,
  basePath: "/api/auth",

  // Enable Debug Logging to track exact OAuth steps in Vercel Logs
  logger: {
    disabled: false,
    level: "debug",
  },

  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),

  user: {
    additionalFields: {
      role: {
        type: "string",
        required: true,
        defaultValue: "CLIENT",
        input: false,
      },
    },
  },

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: config.app.env === "production",
    minPasswordLength: 8,
    maxPasswordLength: 128,

    sendResetPassword: async ({ user, url }) => {
      await sendEmail({
        to: user.email,
        subject: "Reset your password",
        html: resetPasswordEmailTemplate(
          user.name ?? "there",
          url,
        ),
      });
    },
  },

  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,

    sendVerificationEmail: async ({ user, url }) => {
      await sendEmail({
        to: user.email,
        subject: "Verify your email",
        html: verificationEmailTemplate(
          user.name ?? "there",
          url,
        ),
      });
    },
  },

  socialProviders,

  session: {
    expiresIn: 7 * 24 * 60 * 60,
    updateAge: 24 * 60 * 60,
  },

  trustedOrigins,

  advanced: {
    useSecureCookies: true,
    crossSubdomainCookies: {
      enabled: true,
    },
    defaultCookieAttributes: {
      sameSite: "none",
      secure: true,
      httpOnly: true,
    },
  },

  plugins: [
    bearer(),

    twoFactor({
      issuer: APP_NAME,
    }),

    emailOTP({
      otpLength: 6,
      expiresIn: 5 * 60,
      allowedAttempts: 5,
      overrideDefaultEmailVerification: true,

      sendVerificationOTP: async ({
        email,
        otp,
        type,
      }) => {
        const user = await prisma.user.findUnique({
          where: { email },
        });

        const name = user?.name ?? "there";

        const subjectAndPurpose =
          type === "sign-in"
            ? {
                subject: "Your sign-in code",
                purpose: "sign in",
              }
            : type === "email-verification"
              ? {
                  subject: "Verify your email",
                  purpose: "verify your email",
                }
              : {
                  subject: "Reset your password",
                  purpose: "reset your password",
                };

        await sendEmail({
          to: email,
          subject: subjectAndPurpose.subject,
          html: otpEmailTemplate(
            name,
            otp,
            5,
            subjectAndPurpose.purpose,
          ),
        });
      },
    }),
  ],

  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      // Console debug log for OAuth paths
      if (ctx.path.includes("/callback") || ctx.path.includes("/sign-in/social")) {
        console.log("-----------------------------------------");
        console.log(`[OAuth Debugger] Path: ${ctx.path}`);
        console.log(`[OAuth Debugger] Cookies Header:`, ctx.headers?.get("cookie") || "NO COOKIES RECEIVED");
        console.log(`[OAuth Debugger] Query Params:`, JSON.stringify(ctx.query));
        console.log("-----------------------------------------");
      }

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

      if (ctx.path === "/sign-in/email") {
        const parsed = signInEmailValidation.safeParse(ctx.body);

        if (!parsed.success) {
          throw new APIError("BAD_REQUEST", {
            message:
              parsed.error.issues[0]?.message ??
              "Invalid login details.",
          });
        }
      }

      if (ctx.path === "/sign-in/email") {
        const email = ctx.body?.email as string | undefined;

        if (email && (await isLocked(email))) {
          throw new APIError("TOO_MANY_REQUESTS", {
            message:
              "Too many failed login attempts. Please try again in 15 minutes.",
          });
        }
      }
    }),

    after: createAuthMiddleware(async (ctx) => {
      if (ctx.path === "/sign-in/email") {
        const email = ctx.body?.email as string | undefined;

        const returned = ctx.context.returned as
          | { status?: number }
          | undefined;

        const failed = Boolean(
          returned &&
            typeof returned === "object" &&
            "status" in returned &&
            (returned.status ?? 0) >= 400,
        );

        if (email) {
          if (failed) {
            await recordFailedAttempt(email);
          } else {
            await clearFailedAttempts(email);
          }
        }
      }
    }),
  },

  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          await sendEmail({
            to: user.email,
            subject: `Welcome, ${user.name}!`,
            html: welcomeEmailTemplate(user.name),
          });

          const role =
            (
              user as unknown as {
                role?: string;
              }
            ).role ?? "CLIENT";

          if (
            role === "CLIENT" &&
            user.email !== config.superAdmin.email
          ) {
            try {
              const existingClient =
                await prisma.client.findUnique({
                  where: {
                    userId: user.id,
                  },
                });

              if (!existingClient) {
                await prisma.client.create({
                  data: {
                    userId: user.id,
                    name:
                      user.name ||
                      user.email.split("@")[0] ||
                      "Client",
                    email: user.email,
                  },
                });
              }
            } catch (error) {
              console.error(
                "[Auth] Failed to auto-create Client profile:",
                error,
              );
            }
          }
        },
      },
    },
  },
});