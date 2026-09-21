import { z } from "zod";

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const slugField = z
	.string()
	.min(1, "Slug is required.")
	.max(150)
	.regex(slugPattern, "Slug must be lowercase, alphanumeric, and hyphen-separated.");

const portfolioStatusEnum = z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]);

export const createPortfolioValidation = z.object({
	title: z.string().min(1, "Title is required.").max(200),
	slug: slugField,
	clientName: z.string().min(1).optional(),
	industry: z.string().min(1).optional(),
	location: z.string().min(1).optional(),
	websiteUrl: z.string().url().optional(),
	coverImage: z.string().url().optional(),
	description: z.string().max(5000).optional(),
	technologies: z.unknown().optional(),
	duration: z.string().min(1).optional(),
	results: z.unknown().optional(),
	seoTitle: z.string().max(160).optional(),
	seoDescription: z.string().max(300).optional(),
	isFeatured: z.boolean().default(false),
});

export const updatePortfolioValidation = z
	.object({
		title: z.string().min(1).max(200).optional(),
		slug: slugField.optional(),
		clientName: z.string().min(1).nullable().optional(),
		industry: z.string().min(1).nullable().optional(),
		location: z.string().min(1).nullable().optional(),
		websiteUrl: z.string().url().nullable().optional(),
		coverImage: z.string().url().nullable().optional(),
		description: z.string().max(5000).nullable().optional(),
		technologies: z.unknown().nullable().optional(),
		duration: z.string().min(1).nullable().optional(),
		results: z.unknown().nullable().optional(),
		seoTitle: z.string().max(160).nullable().optional(),
		seoDescription: z.string().max(300).nullable().optional(),
		isFeatured: z.boolean().optional(),
	})
	.refine((data) => Object.keys(data).length > 0, { message: "At least one field must be provided." });

export const updatePortfolioStatusValidation = z.object({
	status: portfolioStatusEnum,
});

// Multipart form-data — the image file itself arrives as req.file (see
// portfolio.routes.ts's multer middleware), so only the accompanying text
// fields are validated here.
export const addPortfolioImageValidation = z.object({
	altText: z.string().max(200).optional(),
	caption: z.string().max(300).optional(),
	order: z.coerce.number().int().default(0),
});

export const linkPortfolioServiceValidation = z.object({
	serviceId: z.string().min(1, "serviceId is required."),
});