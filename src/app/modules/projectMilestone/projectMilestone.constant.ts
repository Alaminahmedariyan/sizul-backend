import type { QueryConfig } from "../../queryBuilder";

export const projectMilestoneQueryConfig: QueryConfig = {
	searchableFields: ["title", "description"],
	filterableFields: {
		projectId: "string",
		status: { type: "enum", enum: { PENDING: "PENDING", IN_PROGRESS: "IN_PROGRESS", COMPLETED: "COMPLETED", BLOCKED: "BLOCKED" } },
		dueDate: "date",
	},
	sortableFields: ["order", "createdAt", "dueDate", "startDate"],
	includableRelations: ["project", "tasks"],
};
