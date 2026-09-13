import { transporter } from "../../lib/nodemailer";
import config from "../config";

type SendEmailInput = {
	to: string;
	subject: string;
	html: string;
};

export const sendEmailSmtp = async ({ to, subject, html }: SendEmailInput) => {
	try {
		await transporter.sendMail({
			from: config.email.smtpUser,
			to,
			subject,
			html,
		});
	} catch (error) {
		console.error("[Email] Failed to send email via SMTP:", error);
	}
};