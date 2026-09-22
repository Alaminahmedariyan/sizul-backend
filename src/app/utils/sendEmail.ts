import { transporter } from "../../lib/nodemailer";
import config from "../config";

type SendEmailInput = {
	to: string | string[];
	subject: string;
	html: string;
	text?: string;
	replyTo?: string;
};

/**
 * Convert HTML to a plain-text fallback.
 * Required for clients that cannot render HTML (some corporate
 * mail gateways, accessibility tools, spam filters).
 */
const stripHtml = (html: string): string =>
	html
		.replace(/<style[\s\S]*?<\/style>/gi, "")
		.replace(/<script[\s\S]*?<\/script>/gi, "")
		.replace(/<[^>]+>/g, "")
		.replace(/\s+/g, " ")
		.trim();

export const sendEmail = async ({
	to,
	subject,
	html,
	text,
	replyTo,
}: SendEmailInput): Promise<void> => {
	const from = `"${config.email.fromName}" <${config.email.fromEmail}>`;

	try {
		const info = await transporter.sendMail({
			from,
			to,
			subject,
			html,
			text: text ?? stripHtml(html),
			replyTo,
		});

		if (config.app.env !== "production") {
			const recipients = Array.isArray(to) ? to.join(", ") : to;
			console.log(`[Email] Sent to ${recipients} — ${info.messageId}`);
		}
	} catch (error) {
		// Re-throw so the caller (Better Auth hook, job, etc.)
		// can decide whether to fail the request or retry.
		console.error("[Email] Failed to send:", {
			to,
			subject,
			error: error instanceof Error ? error.message : error,
		});
		throw error;
	}
};