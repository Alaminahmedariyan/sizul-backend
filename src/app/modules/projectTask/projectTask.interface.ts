// Shared request/DTO shapes for the projectTask module.

export type TaskStatus = "TODO" | "IN_PROGRESS" | "IN_REVIEW" | "BLOCKED" | "COMPLETED" | "CANCELLED";
export type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export type CreateTaskInput = {
	projectId: string;
	milestoneId?: string;
	assignedStaffId?: string;
	title: string;
	description?: string;
	priority: TaskPriority;
	dueDate?: Date;
};

export type UpdateTaskInput = {
	milestoneId?: string | null;
	assignedStaffId?: string | null;
	title?: string;
	description?: string | null;
	priority?: TaskPriority;
	dueDate?: Date | null;
};