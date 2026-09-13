import type { QueryConfig } from "../../queryBuilder";

export const clientReviewQueryConfig: QueryConfig = {
	searchableFields: ["title", "content"],
	filterableFields: {
		clientId: "string",
		projectId: "string",
		rating: "number",
		isApproved: "boolean",
		isFeatured: "boolean",
	},
	sortableFields: ["createdAt", "rating"],
	includableRelations: ["client", "project"],
	defaultSortField: "createdAt",
};
