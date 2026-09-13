import nodemailer from "nodemailer";

import config from "../app/config";

export const transporter = nodemailer.createTransport({
	service: "gmail",
	auth: {
		user: config.email.smtpUser,
		pass: config.email.smtpPassword,
	},
});