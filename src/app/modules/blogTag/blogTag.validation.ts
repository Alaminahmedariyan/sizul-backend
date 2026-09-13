import { z } from "zod";

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const slugField = z.string().min(1).max(100).regex(slugPattern, "Slug must be lowercase, alphanumeric, and hyphen-separated.");

export const createBlogTagValidation = z.object({
	name: z.string().min(1, "Name is required.").max(60),
	slug: slugField,
});

export const updateBlogTagValidation = z
	.object({
		name: z.string().min(1).max(60).optional(),
		slug: slugField.optional(),
	})
	.refine((data) => Object.keys(data).length > 0, { message: "At least one field must be provided." });
