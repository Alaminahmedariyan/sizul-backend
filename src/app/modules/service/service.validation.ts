import { z } from "zod";

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const slugField = z
	.string()
	.min(1, "Slug is required.")
	.max(150)
	.regex(slugPattern, "Slug must be lowercase, alphanumeric, and hyphen-separated (e.g. 'seo-services').");

export const createServiceValidation = z.object({
	slug: slugField,
	name: z.string().min(1, "Name is required.").max(150),
	shortName: z.string().min(1).max(60).optional(),
	tagline: z.string().min(1).max(200).optional(),
	description: z.string().max(5000).optional(),
	icon: z.string().min(1).optional(),
	coverImage: z.string().url().optional(),
	features: z.unknown().optional(),
	process: z.unknown().optional(),
	startingPrice: z.coerce.number().nonnegative().optional(),
	currency: z.string().length(3).default("USD"),
	isActive: z.boolean().default(true),
	isFeatured: z.boolean().default(false),
	order: z.coerce.number().int().default(0),
	seoTitle: z.string().max(160).optional(),
	seoDescription: z.string().max(300).optional(),
});

export const updateServiceValidation = z
	.object({
		slug: slugField.optional(),
		name: z.string().min(1).max(150).optional(),
		shortName: z.string().min(1).max(60).nullable().optional(),
		tagline: z.string().min(1).max(200).nullable().optional(),
		description: z.string().max(5000).nullable().optional(),
		icon: z.string().min(1).nullable().optional(),
		coverImage: z.string().url().nullable().optional(),
		features: z.unknown().nullable().optional(),
		process: z.unknown().nullable().optional(),
		startingPrice: z.coerce.number().nonnegative().nullable().optional(),
		currency: z.string().length(3).optional(),
		isActive: z.boolean().optional(),
		isFeatured: z.boolean().optional(),
		order: z.coerce.number().int().optional(),
		seoTitle: z.string().max(160).nullable().optional(),
		seoDescription: z.string().max(300).nullable().optional(),
	})
	.refine((data) => Object.keys(data).length > 0, { message: "At least one field must be provided." });
