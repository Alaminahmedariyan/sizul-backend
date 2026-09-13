import type { QueryConfig } from "../../queryBuilder";

export const projectMemberQueryConfig: QueryConfig = {
	filterableFields: {
		projectId: "string",
		staffId: "string",
		role: { type: "enum", enum: { LEAD: "LEAD", MEMBER: "MEMBER", REVIEWER: "REVIEWER", OBSERVER: "OBSERVER" } },
	},
	sortableFields: ["createdAt"],
	includableRelations: ["project", "staff"],
	defaultSortField: "createdAt",
};
