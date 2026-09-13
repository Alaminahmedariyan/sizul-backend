import { z } from "zod";

export const createClientValidation = z.object({
	userId: z.string().min(1).optional(),
	name: z.string().min(1, "Name is required.").max(150),
	email: z.string().email("A valid email is required."),
	phone: z.string().min(1).optional(),
	company: z.string().min(1).optional(),
	website: z.string().url().optional(),
	location: z.string().min(1).optional(),
	notes: z.string().max(2000).optional(),
});

export const updateClientValidation = z
	.object({
		userId: z.string().min(1).nullable().optional(),
		name: z.string().min(1).max(150).optional(),
		email: z.string().email().optional(),
		phone: z.string().min(1).nullable().optional(),
		company: z.string().min(1).nullable().optional(),
		website: z.string().url().nullable().optional(),
		location: z.string().min(1).nullable().optional(),
		notes: z.string().max(2000).nullable().optional(),
	})
	.refine((data) => Object.keys(data).length > 0, { message: "At least one field must be provided." });

// Fields a Client is allowed to edit on their own profile — no userId, no email
// (email changes should go through Better Auth's verified email-change flow).
export const updateMyClientProfileValidation = z
	.object({
		name: z.string().min(1).max(150).optional(),
		phone: z.string().min(1).nullable().optional(),
		company: z.string().min(1).nullable().optional(),
		website: z.string().url().nullable().optional(),
		location: z.string().min(1).nullable().optional(),
	})
	.refine((data) => Object.keys(data).length > 0, { message: "At least one field must be provided." });

export const updateClientActiveValidation = z.object({
	isActive: z.boolean(),
});
