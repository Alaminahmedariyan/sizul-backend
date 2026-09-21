import { toNodeHandler } from "better-auth/node";
import cookieParser from "cookie-parser";
import cors from "cors";
import express, {
    type Application,
    type NextFunction,
    type Request,
    type Response,
} from "express";
import helmet from "helmet";

import config from "./app/config/index";
import { forceHttps } from "./app/middlewares/forceHttps";
import {
    authRateLimiter,
    generalRateLimiter,
} from "./app/middlewares/rateLimiters";
import { globalErrorHandler } from "./app/middlewares/globalErrorHandler";
import { notFound } from "./app/middlewares/notFound";
import { sanitizeBody } from "./app/middlewares/sanitizeBody";

import { webhookRoutes } from "./app/modules/webhook/webhook.routes";
import { globalRoutes } from "./app/routes/index";

import { auth } from "./lib/auth";
import { prisma } from "./lib/prisma";

const app: Application = express();

// Mandatory for Vercel Reverse Proxy cookie handling
app.set("trust proxy", 1);

if (config.app.env === "production") {
    app.use(forceHttps);
}

app.use(
    helmet({
        crossOriginResourcePolicy: {
            policy: "cross-origin",
        },
    }),
);

app.use(
    (
        req: Request,
        res: Response,
        next: NextFunction,
    ) => {
        const startedAt = Date.now();

        res.on("finish", () => {
            console.log(
                `${req.method} ${req.originalUrl} ${res.statusCode} ${
                    Date.now() - startedAt
                }ms`,
            );
        });

        next();
    },
);

const allowedOrigins = config.app.clientUrl
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

app.use(
    cors({
        origin: allowedOrigins,
        credentials: true,
        methods: [
            "GET",
            "POST",
            "PUT",
            "DELETE",
            "OPTIONS",
            "PATCH",
        ],
        allowedHeaders: [
            "Content-Type",
            "Authorization",
            "Cookie",
            "Origin",
            "X-Requested-With",
        ],
    }),
);

/* ============================================================
   AUTH RATE LIMITERS
   ============================================================ */

app.use("/api/auth/sign-in", authRateLimiter);
app.use("/api/auth/sign-up", authRateLimiter);
app.use("/api/auth/email-otp", authRateLimiter);
app.use("/api/auth/forget-password", authRateLimiter);

/* ============================================================
   STRIPE WEBHOOK
   Must be mounted before express.json()
   ============================================================ */

app.use("/api/v1/webhooks", webhookRoutes);

/* ============================================================
   BETTER AUTH ROUTE HANDLER
   ============================================================ */

app.all(
    "/api/auth/*splat",
    toNodeHandler(auth),
);

/* ============================================================
   BODY PARSERS & COOKIES
   ============================================================ */

app.use(
    express.json({
        limit: "10mb",
    }),
);

app.use(sanitizeBody);

app.use(
    express.urlencoded({
        extended: true,
        limit: "10mb",
    }),
);

app.use(cookieParser());

/* ============================================================
   ROOT & HEALTH CHECK
   ============================================================ */

app.get("/", (_req, res) => {
    res.status(200).json({
        success: true,
        message: "API is running.",
    });
});

app.get("/health", async (_req, res) => {
    try {
        await prisma.$queryRaw`SELECT 1`;

        res.status(200).json({
            success: true,
            status: "healthy",
            database: "connected",
        });
    } catch (error) {
        console.error(
            "[Health] Database health check failed:",
            error,
        );

        res.status(503).json({
            success: false,
            status: "unhealthy",
            database: "disconnected",
        });
    }
});

/* ============================================================
   API ROUTES
   ============================================================ */

app.use("/api/v1", generalRateLimiter, globalRoutes);

/* ============================================================
   404 & ERROR HANDLER
   ============================================================ */

app.use(notFound);
app.use(globalErrorHandler);

export default app;