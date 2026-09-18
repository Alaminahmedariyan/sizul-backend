// Shared request/DTO shapes for the projectMilestone module.

export type MilestoneStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "BLOCKED";

export type CreateMilestoneInput = {
	projectId: string;
	title: string;
	description?: string;
	startDate?: Date;
	dueDate?: Date;
	order: number;
};

export type UpdateMilestoneInput = {
	title?: string;
	description?: string | null;
	startDate?: Date | null;
	dueDate?: Date | null;
	order?: number;
};