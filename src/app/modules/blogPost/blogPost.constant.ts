import type { QueryConfig } from "../../queryBuilder";

export const blogPostQueryConfig: QueryConfig = {
	searchableFields: ["title", "excerpt", "content"],
	filterableFields: {
		slug: "string",
		categoryId: "string",
		authorId: "string",
		status: { type: "enum", enum: { DRAFT: "DRAFT", PUBLISHED: "PUBLISHED", ARCHIVED: "ARCHIVED" } },
	},
	sortableFields: ["createdAt", "publishedAt", "title"],
	includableRelations: ["category", "author", "tags"],
	defaultSortField: "createdAt",
};
