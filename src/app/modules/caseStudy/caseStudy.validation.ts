import { z } from "zod";

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const slugField = z
	.string()
	.min(1, "Slug is required.")
	.max(150)
	.regex(slugPattern, "Slug must be lowercase, alphanumeric, and hyphen-separated.");

const caseStudyStatusEnum = z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]);

export const createCaseStudyValidation = z.object({
	title: z.string().min(1, "Title is required.").max(200),
	slug: slugField,
	clientName: z.string().min(1).optional(),
	industry: z.string().min(1).optional(),
	location: z.string().min(1).optional(),
	coverImage: z.string().url().optional(),
	problem: z.string().max(5000).optional(),
	strategy: z.string().max(5000).optional(),
	implementation: z.string().max(5000).optional(),
	results: z.string().max(5000).optional(),
	metrics: z.unknown().optional(),
	seoTitle: z.string().max(160).optional(),
	seoDescription: z.string().max(300).optional(),
	isFeatured: z.boolean().default(false),
});

export const updateCaseStudyValidation = z
	.object({
		title: z.string().min(1).max(200).optional(),
		slug: slugField.optional(),
		clientName: z.string().min(1).nullable().optional(),
		industry: z.string().min(1).nullable().optional(),
		location: z.string().min(1).nullable().optional(),
		coverImage: z.string().url().nullable().optional(),
		problem: z.string().max(5000).nullable().optional(),
		strategy: z.string().max(5000).nullable().optional(),
		implementation: z.string().max(5000).nullable().optional(),
		results: z.string().max(5000).nullable().optional(),
		metrics: z.unknown().nullable().optional(),
		seoTitle: z.string().max(160).nullable().optional(),
		seoDescription: z.string().max(300).nullable().optional(),
		isFeatured: z.boolean().optional(),
	})
	.refine((data) => Object.keys(data).length > 0, { message: "At least one field must be provided." });

export const updateCaseStudyStatusValidation = z.object({
	status: caseStudyStatusEnum,
});

export const linkCaseStudyServiceValidation = z.object({
	serviceId: z.string().min(1, "serviceId is required."),
});
