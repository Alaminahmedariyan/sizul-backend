import { z } from "zod";

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const slugField = z
	.string()
	.min(1, "Slug is required.")
	.max(150)
	.regex(slugPattern, "Slug must be lowercase, alphanumeric, and hyphen-separated.");

const projectTypeEnum = z.enum(["CLIENT_PROJECT", "INTERNAL_PROJECT", "RESEARCH", "MAINTENANCE"]);
const projectStatusEnum = z.enum(["PLANNING", "IN_PROGRESS", "ON_HOLD", "REVIEW", "COMPLETED", "CANCELLED"]);

export const createProjectValidation = z.object({
	clientId: z.string().min(1).optional(),
	name: z.string().min(1, "Name is required.").max(200),
	slug: slugField,
	projectType: projectTypeEnum.default("CLIENT_PROJECT"),
	description: z.string().max(5000).optional(),
	budget: z.coerce.number().nonnegative().optional(),
	currency: z.string().length(3).default("USD"),
	startDate: z.coerce.date().optional(),
	deadline: z.coerce.date().optional(),
});

export const updateProjectValidation = z
	.object({
		clientId: z.string().min(1).nullable().optional(),
		name: z.string().min(1).max(200).optional(),
		slug: slugField.optional(),
		projectType: projectTypeEnum.optional(),
		description: z.string().max(5000).nullable().optional(),
		budget: z.coerce.number().nonnegative().nullable().optional(),
		currency: z.string().length(3).optional(),
		startDate: z.coerce.date().nullable().optional(),
		deadline: z.coerce.date().nullable().optional(),
	})
	.refine((data) => Object.keys(data).length > 0, { message: "At least one field must be provided." });

export const updateProjectStatusValidation = z.object({
	status: projectStatusEnum,
});

export const updateProjectProgressValidation = z.object({
	progress: z.coerce.number().int().min(0, "Progress cannot be below 0.").max(100, "Progress cannot exceed 100."),
});
