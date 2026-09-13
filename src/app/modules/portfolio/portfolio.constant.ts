import type { QueryConfig } from "../../queryBuilder";

export const portfolioQueryConfig: QueryConfig = {
	searchableFields: ["title", "clientName", "industry", "description"],
	filterableFields: {
		slug: "string",
		industry: "string",
		status: { type: "enum", enum: { DRAFT: "DRAFT", PUBLISHED: "PUBLISHED", ARCHIVED: "ARCHIVED" } },
		isFeatured: "boolean",
	},
	sortableFields: ["createdAt", "publishedAt", "title"],
	includableRelations: ["images", "services"],
	defaultSortField: "createdAt",
};