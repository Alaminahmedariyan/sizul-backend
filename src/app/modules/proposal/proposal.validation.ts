import { z } from "zod";

const proposalItemValidation = z.object({
	serviceId: z.string().min(1).optional(),
	pricingPlanId: z.string().min(1).optional(),
	title: z.string().min(1, "Item title is required.").max(200),
	description: z.string().max(2000).optional(),
	quantity: z.coerce.number().int().positive().default(1),
	unitPrice: z.coerce.number().nonnegative("Unit price cannot be negative."),
});

export const createProposalValidation = z.object({
	leadId: z.string().min(1).optional(),
	clientId: z.string().min(1).optional(),
	projectId: z.string().min(1).optional(),
	title: z.string().min(1, "Title is required.").max(200),
	introduction: z.string().max(5000).optional(),
	terms: z.string().max(5000).optional(),
	notes: z.string().max(3000).optional(),
	discount: z.coerce.number().nonnegative().default(0),
	tax: z.coerce.number().nonnegative().default(0),
	currency: z.string().length(3).default("USD"),
	validUntil: z.coerce.date().optional(),
	items: z.array(proposalItemValidation).min(1, "At least one line item is required."),
});

export const updateProposalValidation = z
	.object({
		leadId: z.string().min(1).nullable().optional(),
		clientId: z.string().min(1).nullable().optional(),
		projectId: z.string().min(1).nullable().optional(),
		title: z.string().min(1).max(200).optional(),
		introduction: z.string().max(5000).nullable().optional(),
		terms: z.string().max(5000).nullable().optional(),
		notes: z.string().max(3000).nullable().optional(),
		discount: z.coerce.number().nonnegative().optional(),
		tax: z.coerce.number().nonnegative().optional(),
		currency: z.string().length(3).optional(),
		validUntil: z.coerce.date().nullable().optional(),
		items: z.array(proposalItemValidation).min(1).optional(),
	})
	.refine((data) => Object.keys(data).length > 0, { message: "At least one field must be provided." });
