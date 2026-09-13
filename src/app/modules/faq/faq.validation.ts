import { z } from "zod";

export const createFaqValidation = z.object({
	question: z.string().min(1, "Question is required.").max(300),
	answer: z.string().min(1, "Answer is required.").max(5000),
	category: z.string().min(1).max(100).optional(),
	isActive: z.boolean().default(true),
	order: z.coerce.number().int().default(0),
});

export const updateFaqValidation = z
	.object({
		question: z.string().min(1).max(300).optional(),
		answer: z.string().min(1).max(5000).optional(),
		category: z.string().min(1).max(100).nullable().optional(),
		isActive: z.boolean().optional(),
		order: z.coerce.number().int().optional(),
	})
	.refine((data) => Object.keys(data).length > 0, { message: "At least one field must be provided." });
