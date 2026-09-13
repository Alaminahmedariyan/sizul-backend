import { z } from "zod";

const contactMessageStatusEnum = z.enum(["UNREAD", "READ", "REPLIED", "ARCHIVED", "SPAM"]);

// Public — website contact form
export const createContactMessageValidation = z.object({
	name: z.string().min(1, "Name is required.").max(150),
	email: z.string().email("A valid email is required."),
	phone: z.string().min(1).optional(),
	company: z.string().min(1).optional(),
	subject: z.string().min(1).max(200).optional(),
	message: z.string().min(1, "Message is required.").max(5000),
});

export const updateContactMessageStatusValidation = z.object({
	status: contactMessageStatusEnum,
});