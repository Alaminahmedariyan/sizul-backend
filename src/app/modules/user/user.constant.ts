import type { QueryConfig } from "../../queryBuilder";

export const userQueryConfig: QueryConfig = {
	searchableFields: ["email", "name"],
	filterableFields: {
		email: "string",
		name: "string",
		role: { type: "enum", enum: { ADMIN: "ADMIN", STAFF: "STAFF", CLIENT: "CLIENT" } },
		status: { type: "enum", enum: { ACTIVE: "ACTIVE", INACTIVE: "INACTIVE", SUSPENDED: "SUSPENDED" } },
	},
	sortableFields: ["createdAt", "updatedAt", "email", "name", "lastLoginAt"],
	includableRelations: ["staffProfile", "clientProfile"],
	defaultSortField: "createdAt",
};
