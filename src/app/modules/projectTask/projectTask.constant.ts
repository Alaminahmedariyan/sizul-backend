import type { QueryConfig } from "../../queryBuilder";

export const projectTaskQueryConfig: QueryConfig = {
	searchableFields: ["title", "description"],
	filterableFields: {
		projectId: "string",
		milestoneId: "string",
		assignedStaffId: "string",
		status: {
			type: "enum",
			enum: {
				TODO: "TODO",
				IN_PROGRESS: "IN_PROGRESS",
				IN_REVIEW: "IN_REVIEW",
				BLOCKED: "BLOCKED",
				COMPLETED: "COMPLETED",
				CANCELLED: "CANCELLED",
			},
		},
		priority: { type: "enum", enum: { LOW: "LOW", MEDIUM: "MEDIUM", HIGH: "HIGH", URGENT: "URGENT" } },
		dueDate: "date",
	},
	sortableFields: ["createdAt", "updatedAt", "dueDate", "priority", "title"],
	includableRelations: ["project", "milestone", "assignedStaff"],
	defaultSortField: "createdAt",
};
