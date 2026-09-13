import { z } from "zod";

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const slugField = z.string().min(1).max(150).regex(slugPattern, "Slug must be lowercase, alphanumeric, and hyphen-separated.");

export const createBlogCategoryValidation = z.object({
	name: z.string().min(1, "Name is required.").max(100),
	slug: slugField,
	description: z.string().max(1000).optional(),
	isActive: z.boolean().default(true),
});

export const updateBlogCategoryValidation = z
	.object({
		name: z.string().min(1).max(100).optional(),
		slug: slugField.optional(),
		description: z.string().max(1000).nullable().optional(),
		isActive: z.boolean().optional(),
	})
	.refine((data) => Object.keys(data).length > 0, { message: "At least one field must be provided." });
