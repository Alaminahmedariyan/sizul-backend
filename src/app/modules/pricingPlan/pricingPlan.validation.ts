import { z } from "zod";

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const slugField = z
	.string()
	.min(1, "Slug is required.")
	.max(150)
	.regex(slugPattern, "Slug must be lowercase, alphanumeric, and hyphen-separated.");

const billingIntervalEnum = z.enum(["ONE_TIME", "MONTHLY", "QUARTERLY", "YEARLY", "CUSTOM"]);

export const createPricingPlanValidation = z.object({
	serviceId: z.string().min(1, "serviceId is required."),
	slug: slugField,
	name: z.string().min(1, "Name is required.").max(150),
	description: z.string().max(3000).optional(),
	price: z.coerce.number().nonnegative("Price cannot be negative."),
	currency: z.string().length(3).default("USD"),
	billingInterval: billingIntervalEnum.default("ONE_TIME"),
	features: z.unknown().optional(),
	isPopular: z.boolean().default(false),
	isActive: z.boolean().default(true),
	order: z.coerce.number().int().default(0),
});

export const updatePricingPlanValidation = z
	.object({
		serviceId: z.string().min(1).optional(),
		slug: slugField.optional(),
		name: z.string().min(1).max(150).optional(),
		description: z.string().max(3000).nullable().optional(),
		price: z.coerce.number().nonnegative().optional(),
		currency: z.string().length(3).optional(),
		billingInterval: billingIntervalEnum.optional(),
		features: z.unknown().nullable().optional(),
		isPopular: z.boolean().optional(),
		isActive: z.boolean().optional(),
		order: z.coerce.number().int().optional(),
	})
	.refine((data) => Object.keys(data).length > 0, { message: "At least one field must be provided." });
