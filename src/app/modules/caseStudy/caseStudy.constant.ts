import type { QueryConfig } from "../../queryBuilder";

export const caseStudyQueryConfig: QueryConfig = {
	searchableFields: ["title", "clientName", "industry", "problem", "results"],
	filterableFields: {
		slug: "string",
		industry: "string",
		status: { type: "enum", enum: { DRAFT: "DRAFT", PUBLISHED: "PUBLISHED", ARCHIVED: "ARCHIVED" } },
		isFeatured: "boolean",
	},
	sortableFields: ["createdAt", "publishedAt", "title"],
	includableRelations: ["services"],
	defaultSortField: "createdAt",
};
