import { z } from "zod";

const appreciationTypeEnum = z.enum(["THANK_YOU_NOTE", "GIFT", "REFERRAL", "BONUS", "TESTIMONIAL", "OTHER"]);

export const createAppreciationValidation = z.object({
	clientId: z.string().min(1, "clientId is required."),
	projectId: z.string().min(1).optional(),
	type: appreciationTypeEnum,
	amount: z.coerce.number().nonnegative().optional(),
	currency: z.string().length(3).optional(),
	title: z.string().min(1).max(150).optional(),
	description: z.string().max(2000).optional(),
	receivedAt: z.coerce.date().optional(),
});

export const updateAppreciationValidation = z
	.object({
		projectId: z.string().min(1).nullable().optional(),
		type: appreciationTypeEnum.optional(),
		amount: z.coerce.number().nonnegative().nullable().optional(),
		currency: z.string().length(3).nullable().optional(),
		title: z.string().min(1).max(150).nullable().optional(),
		description: z.string().max(2000).nullable().optional(),
		receivedAt: z.coerce.date().optional(),
	})
	.refine((data) => Object.keys(data).length > 0, { message: "At least one field must be provided." });
