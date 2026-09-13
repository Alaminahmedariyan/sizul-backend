import { z } from "zod";

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const slugField = z.string().min(1).max(200).regex(slugPattern, "Slug must be lowercase, alphanumeric, and hyphen-separated.");

const postStatusEnum = z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]);

export const createBlogPostValidation = z.object({
	categoryId: z.string().min(1).optional(),
	title: z.string().min(1, "Title is required.").max(200),
	slug: slugField,
	excerpt: z.string().max(500).optional(),
	content: z.string().min(1, "Content is required."),
	featuredImage: z.string().url().optional(),
	seoTitle: z.string().max(160).optional(),
	seoDescription: z.string().max(300).optional(),
	canonicalUrl: z.string().url().optional(),
	schemaMarkup: z.unknown().optional(),
	tagIds: z.array(z.string().min(1)).default([]),
});

export const updateBlogPostValidation = z
	.object({
		categoryId: z.string().min(1).nullable().optional(),
		title: z.string().min(1).max(200).optional(),
		slug: slugField.optional(),
		excerpt: z.string().max(500).nullable().optional(),
		content: z.string().min(1).optional(),
		featuredImage: z.string().url().nullable().optional(),
		seoTitle: z.string().max(160).nullable().optional(),
		seoDescription: z.string().max(300).nullable().optional(),
		canonicalUrl: z.string().url().nullable().optional(),
		schemaMarkup: z.unknown().nullable().optional(),
		tagIds: z.array(z.string().min(1)).optional(),
	})
	.refine((data) => Object.keys(data).length > 0, { message: "At least one field must be provided." });

export const updateBlogPostStatusValidation = z.object({
	status: postStatusEnum,
});
