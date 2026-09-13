import type { QueryConfig } from "../../queryBuilder";

export const testimonialQueryConfig: QueryConfig = {
	searchableFields: ["clientName", "companyName", "content", "serviceName"],
	filterableFields: {
		status: { type: "enum", enum: { DRAFT: "DRAFT", PUBLISHED: "PUBLISHED", ARCHIVED: "ARCHIVED" } },
		isFeatured: "boolean",
		rating: "number",
	},
	sortableFields: ["createdAt", "publishedAt", "rating"],
};
