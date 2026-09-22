import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";

import config from "../app/config";

const hasCustomHost = Boolean(config.email.smtpHost);

/**
 * SMTP transporter singleton.
 *
 * Two modes:
 *   1. SMTP_HOST is set → use host/port (SES, Resend, Mailgun, etc.)
 *   2. SMTP_HOST empty  → fallback to Gmail service (dev convenience)
 *
 * Pooling is enabled so the same TCP connection is reused across
 * sends. Timeouts prevent the request from hanging when the SMTP
 * server is unreachable.
 */
export const transporter: Transporter = nodemailer.createTransport(
	hasCustomHost
		? {
				host: config.email.smtpHost,
				port: config.email.smtpPort,
				secure: config.email.smtpSecure, // true = 465, false = 587/25
				auth: {
					user: config.email.smtpUser,
					pass: config.email.smtpPassword,
				},
				pool: true,
				maxConnections: 5,
				maxMessages: 100,
				connectionTimeout: 10_000,
				greetingTimeout: 10_000,
				socketTimeout: 20_000,
			}
		: {
				service: "gmail",
				auth: {
					user: config.email.smtpUser,
					pass: config.email.smtpPassword,
				},
				pool: true,
				maxConnections: 5,
				connectionTimeout: 10_000,
				greetingTimeout: 10_000,
				socketTimeout: 20_000,
			},
);

/**
 * Boot-time SMTP verification.
 * Call this once from server.ts so misconfigured credentials fail fast.
 */
export const verifyEmailConnection = async (): Promise<void> => {
	try {
		await transporter.verify();
		console.log("[Email] SMTP connection verified");
	} catch (err) {
		console.error("[Email] SMTP connection failed", err);
	}
};