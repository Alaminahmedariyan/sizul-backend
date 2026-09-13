import type { QueryConfig } from "../../queryBuilder";

export const clientQueryConfig: QueryConfig = {
	searchableFields: ["name", "email", "company"],
	filterableFields: {
		name: "string",
		email: "string",
		company: "string",
		isActive: "boolean",
	},
	sortableFields: ["createdAt", "updatedAt", "name"],
	includableRelations: ["user", "leads", "projects", "proposals", "reviews", "appreciations"],
	defaultSortField: "createdAt",
};
