import { z } from "zod";

const taskStatusEnum = z.enum(["TODO", "IN_PROGRESS", "IN_REVIEW", "BLOCKED", "COMPLETED", "CANCELLED"]);
const taskPriorityEnum = z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]);

export const createTaskValidation = z.object({
	projectId: z.string().min(1, "projectId is required."),
	milestoneId: z.string().min(1).optional(),
	assignedStaffId: z.string().min(1).optional(),
	title: z.string().min(1, "Title is required.").max(200),
	description: z.string().max(3000).optional(),
	priority: taskPriorityEnum.default("MEDIUM"),
	dueDate: z.coerce.date().optional(),
});

export const updateTaskValidation = z
	.object({
		milestoneId: z.string().min(1).nullable().optional(),
		assignedStaffId: z.string().min(1).nullable().optional(),
		title: z.string().min(1).max(200).optional(),
		description: z.string().max(3000).nullable().optional(),
		priority: taskPriorityEnum.optional(),
		dueDate: z.coerce.date().nullable().optional(),
	})
	.refine((data) => Object.keys(data).length > 0, { message: "At least one field must be provided." });

export const updateTaskStatusValidation = z.object({
	status: taskStatusEnum,
});
