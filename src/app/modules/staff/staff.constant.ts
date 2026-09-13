import type { QueryConfig } from "../../queryBuilder";

export const staffQueryConfig: QueryConfig = {
	searchableFields: ["fullName", "email", "employeeId"],
	filterableFields: {
		fullName: "string",
		email: "string",
		employeeId: "string",
		department: "string",
		role: {
			type: "enum",
			enum: {
				OWNER: "OWNER",
				MANAGER: "MANAGER",
				DEVELOPER: "DEVELOPER",
				DESIGNER: "DESIGNER",
				MARKETING: "MARKETING",
				SALES: "SALES",
				SUPPORT: "SUPPORT",
			},
		},
		status: {
			type: "enum",
			enum: { ACTIVE: "ACTIVE", INACTIVE: "INACTIVE", ON_LEAVE: "ON_LEAVE", TERMINATED: "TERMINATED" },
		},
	},
	sortableFields: ["createdAt", "updatedAt", "fullName", "hireDate"],
	includableRelations: ["user", "assignedLeads", "assignedTasks", "projectMemberships"],
	defaultSortField: "createdAt",
};
