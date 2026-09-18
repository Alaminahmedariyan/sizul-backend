import type { QueryConfig } from "../../queryBuilder";

export const projectQueryConfig: QueryConfig = {
	searchableFields: ["name", "description"],
	filterableFields: {
		name: "string",
		slug: "string",
		clientId: "string",
		serviceId: "string",
		projectType: {
			type: "enum",
			enum: {
				CLIENT_PROJECT: "CLIENT_PROJECT",
				INTERNAL_PROJECT: "INTERNAL_PROJECT",
				RESEARCH: "RESEARCH",
				MAINTENANCE: "MAINTENANCE",
			},
		},
		status: {
			type: "enum",
			enum: {
				PLANNING: "PLANNING",
				IN_PROGRESS: "IN_PROGRESS",
				ON_HOLD: "ON_HOLD",
				REVIEW: "REVIEW",
				COMPLETED: "COMPLETED",
				CANCELLED: "CANCELLED",
			},
		},
		deadline: "date",
	},
	sortableFields: ["createdAt", "updatedAt", "deadline", "startDate", "name", "progress"],
	includableRelations: ["client", "service", "members", "milestones", "tasks", "files"],
	defaultSortField: "createdAt",
};