import { z } from "zod";

const milestoneStatusEnum = z.enum(["PENDING", "IN_PROGRESS", "COMPLETED", "BLOCKED"]);

export const createMilestoneValidation = z.object({
	projectId: z.string().min(1, "projectId is required."),
	title: z.string().min(1, "Title is required.").max(200),
	description: z.string().max(3000).optional(),
	startDate: z.coerce.date().optional(),
	dueDate: z.coerce.date().optional(),
	order: z.coerce.number().int().default(0),
});

export const updateMilestoneValidation = z
	.object({
		title: z.string().min(1).max(200).optional(),
		description: z.string().max(3000).nullable().optional(),
		startDate: z.coerce.date().nullable().optional(),
		dueDate: z.coerce.date().nullable().optional(),
		order: z.coerce.number().int().optional(),
	})
	.refine((data) => Object.keys(data).length > 0, { message: "At least one field must be provided." });

export const updateMilestoneStatusValidation = z.object({
	status: milestoneStatusEnum,
});
